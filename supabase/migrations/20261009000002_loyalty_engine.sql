-- ============================================================================
-- 0003 · Motor de fidelización — RPCs transaccionales (Fase 4)
-- ============================================================================
-- Diseño:
--  * Funciones security definer: la autorización se comprueba DENTRO
--    (rol activo en la organización). Bypasean RLS de forma controlada.
--  * Idempotencia: mismo idempotency_key → devuelve la operación original
--    sin duplicar efectos.
--  * Atomicidad: lock del saldo + INSERT del movimiento en la misma tx.
--  * Sin saldos negativos: UPDATE condicional con check >= 0.
--  * Ledger append-only: correcciones vía 'reversal' con referencia.
-- ============================================================================

-- ---------- earn: otorgar puntos/sellos --------------------------------------

create or replace function public.earn(
  p_account_id      uuid,
  p_points_delta    bigint default 0,
  p_stamps_delta    int    default 0,
  p_amount_minor    bigint default null,
  p_location_id     uuid   default null,
  p_idempotency_key text   default null,
  p_reason          text   default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org  uuid;
  v_tx   uuid;
begin
  if p_points_delta <= 0 and p_stamps_delta <= 0 then
    raise exception 'earn requiere un delta positivo';
  end if;

  select organization_id into v_org
    from public.loyalty_accounts
   where id = p_account_id;
  if v_org is null then
    raise exception 'account_not_found';
  end if;

  -- autorización: caller con rol operativo en la org de la cuenta
  if not public.current_user_has_role(v_org, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;

  -- idempotencia: la clave ya usada devuelve la tx original, sin duplicar
  if p_idempotency_key is not null then
    select id into v_tx
      from public.loyalty_transactions
     where organization_id = v_org and idempotency_key = p_idempotency_key;
    if found then return v_tx; end if;
  end if;

  -- lock + update atómico del saldo (check constraints bloquean negativos)
  update public.loyalty_accounts
     set current_points = current_points + p_points_delta,
         current_stamps = current_stamps + p_stamps_delta,
         version        = version + 1
   where id = p_account_id;

  insert into public.loyalty_transactions (
    organization_id, account_id, transaction_type,
    points_delta, stamps_delta, amount_minor,
    location_id, performed_by, idempotency_key, reason
  ) values (
    v_org, p_account_id, 'earn',
    p_points_delta, p_stamps_delta, p_amount_minor,
    p_location_id, auth.uid(), p_idempotency_key, p_reason
  ) returning id into v_tx;

  return v_tx;
end;
$$;

-- ---------- redeem: canje atómico de recompensa ------------------------------

create or replace function public.redeem_reward(
  p_reward_id       uuid,
  p_customer_id     uuid,
  p_location_id     uuid   default null,
  p_idempotency_key text   default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward   public.rewards%rowtype;
  v_account  public.loyalty_accounts%rowtype;
  v_red_id   uuid;
begin
  select * into v_reward
    from public.rewards
   where id = p_reward_id and status = 'active';
  if not found then
    raise exception 'reward_not_found';
  end if;

  if not public.current_user_has_role(v_reward.organization_id, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;

  -- idempotencia
  if p_idempotency_key is not null then
    select id into v_red_id
      from public.redemptions
     where organization_id = v_reward.organization_id
       and idempotency_key = p_idempotency_key;
    if found then return v_red_id; end if;
  end if;

  select * into v_account
    from public.loyalty_accounts
   where organization_id = v_reward.organization_id
     and customer_id = p_customer_id
     and program_id  = v_reward.program_id
   for update;  -- lock: dos canjes simultáneos se serializan aquí
  if not found then
    raise exception 'account_not_found';
  end if;

  -- cobro atómico: falla entera si el saldo no alcanza (sin negativos)
  if v_reward.cost_stamps is not null then
    update public.loyalty_accounts
       set current_stamps = current_stamps - v_reward.cost_stamps,
           version = version + 1
     where id = v_account.id
       and current_stamps >= v_reward.cost_stamps;
  else
    update public.loyalty_accounts
       set current_points = current_points - v_reward.cost_points,
           version = version + 1
     where id = v_account.id
       and current_points >= v_reward.cost_points;
  end if;
  if not found then
    raise exception 'insufficient_balance';
  end if;

  insert into public.redemptions (
    organization_id, customer_id, reward_id, account_id,
    location_id, performed_by, status, idempotency_key
  ) values (
    v_reward.organization_id, p_customer_id, p_reward_id, v_account.id,
    p_location_id, auth.uid(), 'completed', p_idempotency_key
  ) returning id into v_red_id;

  insert into public.loyalty_transactions (
    organization_id, account_id, transaction_type,
    points_delta, stamps_delta, location_id, performed_by,
    idempotency_key, reason
  ) values (
    v_reward.organization_id, v_account.id, 'redeem',
    -coalesce(v_reward.cost_points, 0), -coalesce(v_reward.cost_stamps, 0),
    p_location_id, auth.uid(),
    case when p_idempotency_key is null then null else p_idempotency_key || ':tx' end,
    'redemption:' || v_red_id::text
  );

  return v_red_id;
end;
$$;

-- ---------- reverse: compensación (nunca edita el historial) ------------------

create or replace function public.reverse_transaction(
  p_transaction_id uuid,
  p_reason         text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_orig public.loyalty_transactions%rowtype;
  v_tx   uuid;
begin
  select * into v_orig
    from public.loyalty_transactions
   where id = p_transaction_id;
  if not found then
    raise exception 'transaction_not_found';
  end if;

  if not public.current_user_has_role(v_orig.organization_id, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;

  -- ya existe un reverso de esta tx?
  if exists (select 1 from public.loyalty_transactions
              where reference_transaction_id = p_transaction_id
                and transaction_type = 'reversal') then
    raise exception 'already_reversed';
  end if;

  -- aplicar el delta inverso en la misma tx (los checks impiden negativos)
  update public.loyalty_accounts
     set current_points = current_points - v_orig.points_delta,
         current_stamps = current_stamps - v_orig.stamps_delta,
         version        = version + 1
   where id = v_orig.account_id;

  insert into public.loyalty_transactions (
    organization_id, account_id, transaction_type,
    points_delta, stamps_delta, location_id, performed_by,
    reference_transaction_id, reason
  ) values (
    v_orig.organization_id, v_orig.account_id, 'reversal',
    -v_orig.points_delta, -v_orig.stamps_delta, v_orig.location_id,
    auth.uid(), p_transaction_id, coalesce(p_reason, 'reversal')
  ) returning id into v_tx;

  return v_tx;
end;
$$;

-- ---------- record_visit: visita con earn opcional en una sola tx ------------

create or replace function public.record_visit(
  p_customer_id          uuid,
  p_location_id          uuid   default null,
  p_purchase_amount_minor bigint default null,
  p_source               text   default 'manual',
  p_idempotency_key      text   default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org   uuid;
  v_visit uuid;
begin
  select organization_id into v_org
    from public.customers
   where id = p_customer_id;
  if v_org is null then
    raise exception 'customer_not_found';
  end if;

  if not public.current_user_has_role(v_org, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;

  if p_idempotency_key is not null then
    select id into v_visit
      from public.customer_visits
     where organization_id = v_org and idempotency_key = p_idempotency_key;
    if found then return v_visit; end if;
  end if;

  insert into public.customer_visits (
    organization_id, customer_id, location_id, performed_by,
    source, purchase_amount_minor, idempotency_key
  ) values (
    v_org, p_customer_id, p_location_id, auth.uid(),
    p_source, p_purchase_amount_minor, p_idempotency_key
  ) returning id into v_visit;

  return v_visit;
end;
$$;

-- ---------- permisos de ejecución ---------------------------------------------
-- Solo 'authenticated' (staff logueado) puede invocarlas; la autorización fina
-- está dentro de cada función. anon nunca.

revoke all on function public.earn(uuid, bigint, int, bigint, uuid, text, text)          from public, anon;
revoke all on function public.redeem_reward(uuid, uuid, uuid, text)                       from public, anon;
revoke all on function public.reverse_transaction(uuid, text)                             from public, anon;
revoke all on function public.record_visit(uuid, uuid, bigint, text, text)                from public, anon;
grant execute on function public.earn(uuid, bigint, int, bigint, uuid, text, text)          to authenticated;
grant execute on function public.redeem_reward(uuid, uuid, uuid, text)                       to authenticated;
grant execute on function public.reverse_transaction(uuid, text)                             to authenticated;
grant execute on function public.record_visit(uuid, uuid, bigint, text, text)                to authenticated;
