-- ============================================================================
-- Fase 5 — QR y flujo de empleado
--
--  * customer_cards: token público opaco (base64url de 144 bits), revocable,
--    rotatable. El QR solo codifica /t/{token} — cero datos personales.
--  * get_card_public: proyección pública mínima (security definer, sin RLS
--    público sobre tablas con PII).
--  * scan_card: flujo de empleado atómico — resuelve token, valida membresía
--    staff+, registra visita + earn en una sola transacción, con rate limit
--    a nivel base de datos por empleado.
-- ============================================================================

create table public.customer_cards (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete cascade,
  account_id      uuid not null references public.loyalty_accounts(id) on delete cascade,
  token           text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status          text not null default 'active' check (status in ('active','revoked')),
  created_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  unique (account_id)
);
create index customer_cards_org_idx on public.customer_cards (organization_id, status);
create index customer_cards_token_idx on public.customer_cards (token) where status = 'active';

alter table public.customer_cards enable row level security;

create policy cards_select on public.customer_cards
  for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));
-- Sin policies de escritura: emitir/revocar solo por RPCs security definer.

grant select on public.customer_cards to authenticated;

-- ---------- issue_card: crear cuenta (si falta) + tarjeta --------------------
-- Idempotente: una tarjeta por cuenta; si ya existe devuelve la existente.

create or replace function public.issue_card(
  p_customer_id uuid,
  p_program_id  uuid
)
returns uuid  -- card id
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org     uuid;
  v_prog    public.loyalty_programs%rowtype;
  v_account uuid;
  v_card    uuid;
begin
  select organization_id into v_org from public.customers where id = p_customer_id;
  if v_org is null then raise exception 'customer_not_found'; end if;

  if not public.current_user_has_role(v_org, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;

  select * into v_prog from public.loyalty_programs
   where id = p_program_id and organization_id = v_org and status = 'active';
  if not found then raise exception 'program_not_found'; end if;

  insert into public.loyalty_accounts (organization_id, customer_id, program_id)
  values (v_org, p_customer_id, p_program_id)
  on conflict (organization_id, customer_id, program_id) do nothing;

  select id into v_account from public.loyalty_accounts
   where organization_id = v_org and customer_id = p_customer_id
     and program_id = p_program_id;

  insert into public.customer_cards (organization_id, customer_id, account_id)
  values (v_org, p_customer_id, v_account)
  on conflict (account_id) do nothing;

  select id into v_card from public.customer_cards where account_id = v_account;
  return v_card;
end;
$$;

-- ---------- revoke_card / rotate_card_token ---------------------------------

create or replace function public.revoke_card(p_card_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.customer_cards where id = p_card_id;
  if v_org is null then raise exception 'card_not_found'; end if;
  if not public.current_user_has_role(v_org, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;
  update public.customer_cards
     set status = 'revoked', revoked_at = now()
   where id = p_card_id and status = 'active';
end;
$$;

-- Rotar token: el QR viejo muere al instante; la tarjeta y saldo se conservan.
create or replace function public.rotate_card_token(p_card_id uuid)
returns text  -- nuevo token
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org   uuid;
  v_token text;
begin
  select organization_id into v_org from public.customer_cards where id = p_card_id;
  if v_org is null then raise exception 'card_not_found'; end if;
  if not public.current_user_has_role(v_org, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;
  update public.customer_cards
     set token = replace(gen_random_uuid()::text, '-', ''),
         status = 'active', revoked_at = null
   where id = p_card_id
   returning token into v_token;
  return v_token;
end;
$$;

-- ---------- get_card_public: vista pública mínima ----------------------------
-- Lo único que el QR expone: nombre de programa, progreso, primer nombre.
-- Sin email/teléfono/apellido. Ejecutable por anon (la web del cliente es
-- pública por diseño; el token de 144 bits ES el credential).

create or replace function public.get_card_public(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
begin
  select c.id as card_id, c.status, o.name as org_name,
         cu.first_name, p.name as program_name, p.program_type,
         p.stamp_goal, a.current_stamps, a.current_points
    into v
    from public.customer_cards c
    join public.organizations o on o.id = c.organization_id
    join public.customers cu on cu.id = c.customer_id
    join public.loyalty_accounts a on a.id = c.account_id
    join public.loyalty_programs p on p.id = a.program_id
   where c.token = p_token;
  if not found then return null; end if;
  return json_build_object(
    'org_name', v.org_name,
    'first_name', v.first_name,
    'program_name', v.program_name,
    'program_type', v.program_type,
    'stamp_goal', v.stamp_goal,
    'current_stamps', v.current_stamps,
    'current_points', v.current_points,
    'card_status', v.status
  );
end;
$$;

-- ---------- scan_card: escaneo de empleado, todo-en-uno ----------------------
-- Resuelve token → valida rol → rate limit → visita + earn atómicos.
-- Devuelve JSON con el estado resultante para confirmación visual.

create or replace function public.scan_card(
  p_token           text,
  p_stamps          int  default 1,
  p_location_id     uuid default null,
  p_idempotency_key text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card record;
  v_tx   uuid;
  v_scans int;
begin
  select c.id, c.organization_id, c.customer_id, c.account_id, c.status
    into v_card
    from public.customer_cards c
   where c.token = p_token;
  if not found then raise exception 'card_not_found'; end if;
  if v_card.status <> 'active' then raise exception 'card_revoked'; end if;

  if not public.current_user_has_role(
        v_card.organization_id, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;

  -- Rate limit: máx. 60 escaneos/minuto por empleado. El abuso masivo se
  -- detecta además en audit_logs (performed_by en cada visita).
  select count(*) into v_scans
    from public.customer_visits
   where performed_by = auth.uid()
     and created_at > now() - interval '1 minute';
  if v_scans >= 60 then raise exception 'rate_limited'; end if;

  -- Idempotencia a nivel de org para retries del cliente.
  if p_idempotency_key is not null then
    select id into v_tx from public.loyalty_transactions
     where organization_id = v_card.organization_id
       and idempotency_key = p_idempotency_key;
    if found then
      return (select public.get_card_public(p_token));
    end if;
  end if;

  -- Visita + earn en una transacción (earn valida y actualiza saldo).
  insert into public.customer_visits (
    organization_id, customer_id, location_id, performed_by,
    source, idempotency_key
  ) values (
    v_card.organization_id, v_card.customer_id, p_location_id, auth.uid(),
    'staff_qr', p_idempotency_key
  );

  if p_stamps > 0 then
    v_tx := public.earn(
      v_card.account_id, 0, p_stamps, null, p_location_id,
      p_idempotency_key, 'qr_scan'
    );
  end if;

  return public.get_card_public(p_token);
end;
$$;

-- ---------- permisos ----------------------------------------------------------

revoke all on function public.issue_card(uuid, uuid)                    from public, anon;
revoke all on function public.revoke_card(uuid)                         from public, anon;
revoke all on function public.rotate_card_token(uuid)                   from public, anon;
revoke all on function public.get_card_public(text)                     from public;
revoke all on function public.scan_card(text, int, uuid, text)          from public, anon;
grant execute on function public.issue_card(uuid, uuid)                    to authenticated;
grant execute on function public.revoke_card(uuid)                         to authenticated;
grant execute on function public.rotate_card_token(uuid)                   to authenticated;
grant execute on function public.get_card_public(text)                     to anon, authenticated;
grant execute on function public.scan_card(text, int, uuid, text)          to authenticated;
