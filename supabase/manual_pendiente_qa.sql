-- ============================================================================
-- PENDIENTE DE APLICAR A MANO en Supabase → SQL Editor (QA fases 1-5)
-- ============================================================================
-- El MCP de Supabase rechaza (sin pedir confirmación) cualquier migración cuyo
-- texto contenga `delete from`, aunque esté dentro del cuerpo de una función.
-- Todo lo demás de 0017-0021 YA se aplicó por MCP. Faltan SOLO estas 4 funciones:
--   1. resolve_rights_request   (0019 · derechos de titulares)
--   2. register_customer_via_join (0019 · exige correo de privacidad)
--   3. close_organization       (0021)
--   4. delete_organization      (0021)
-- Pegar TODO este archivo en el SQL Editor y ejecutar (una sola vez; es idempotente).
-- ============================================================================

-- 1) resolve_rights_request
create or replace function public.resolve_rights_request(
  p_request_id uuid,
  p_status     text,
  p_response   text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  r           record;
  v_resp      text := nullif(btrim(coalesce(p_response, '')), '');
  v_closing   boolean;
  v_destructive boolean;
begin
  if p_status not in ('in_progress', 'resolved', 'rejected') then
    raise exception 'invalid_status';
  end if;

  select q.id, q.organization_id, q.customer_id, q.request_type, q.status,
         c.email as c_email, c.first_name as c_first, o.name as org_name
    into r
    from public.data_rights_requests q
    join public.organizations o on o.id = q.organization_id
    left join public.customers c on c.id = q.customer_id
   where q.id = p_request_id;
  if not found then raise exception 'request_not_found'; end if;

  if not public.current_user_has_role(r.organization_id, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;

  v_closing := p_status in ('resolved', 'rejected');
  v_destructive := p_status = 'resolved' and r.request_type in ('erasure', 'revocation');
  if v_destructive
     and not public.current_user_has_role(r.organization_id, array['owner','admin']) then
    raise exception 'forbidden_destructive';
  end if;

  -- open → in_progress | resolved | rejected ; in_progress → resolved | rejected
  if r.status not in ('open', 'in_progress')
     or (r.status = 'in_progress' and p_status = 'in_progress') then
    raise exception 'invalid_transition';
  end if;

  if v_closing and (v_resp is null or char_length(v_resp) < 10) then
    raise exception 'response_required';
  end if;

  update public.data_rights_requests
     set status      = p_status,
         response    = coalesce(v_resp, response),
         resolved_at = case when v_closing then now() else null end
   where id = p_request_id;

  if v_destructive and r.customer_id is not null then
    insert into public.customer_consents
      (organization_id, customer_id, purpose, channel, status, capture_method)
    select r.organization_id, r.customer_id, v.purpose, v.channel, 'withdrawn', 'admin'
      from (values ('data_processing', 'web'),
                   ('marketing_email', 'email'),
                   ('push_notifications', 'push'),
                   ('location', 'location')) as v(purpose, channel);

    update public.customer_cards
       set status = 'revoked', revoked_at = now()
     where customer_id = r.customer_id and status = 'active';
    delete from public.push_subscriptions where customer_id = r.customer_id;

    if r.request_type = 'erasure' then
      delete from public.email_outbox where customer_id = r.customer_id;
      update public.data_rights_requests set detail = null
       where customer_id = r.customer_id;
      update public.customers
         set first_name = 'Titular eliminado', last_name = null, email = null,
             phone = null, birth_date = null,
             external_ref = gen_random_uuid()::text,
             marketing_consent_at = null, push_consent_state = 'withdrawn',
             status = 'inactive'
       where id = r.customer_id;
    else
      update public.customers
         set marketing_consent_at = null, push_consent_state = 'withdrawn',
             status = 'inactive'
       where id = r.customer_id;
    end if;
  end if;

  -- Datos para avisar al titular (capturados ANTES de anonimizar).
  return json_build_object(
    'ok',           true,
    'status',       p_status,
    'request_type', r.request_type,
    'org_name',     r.org_name,
    'notify_email', r.c_email,
    'first_name',   r.c_first
  );
end;
$$;

revoke all on function public.resolve_rights_request(uuid, text, text) from public, anon;
grant execute on function public.resolve_rights_request(uuid, text, text) to authenticated;

-- 2) register_customer_via_join (con el control de canal de privacidad)
create or replace function public.register_customer_via_join(
  p_token           text,
  p_first_name      text,
  p_email           text,
  p_phone           text default null,
  p_marketing       boolean default false,
  p_client_hash     text default null,
  p_idempotency_key text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org      record;
  v_prog     record;
  v_email    text;
  v_phone    text;
  v_customer uuid;
  v_account  uuid;
  v_token    text;
  v_attempts int;
  v_version  text;
begin
  -- 1. Resolver comercio por token público (nunca por merchant_id del cliente)
  select o.id, o.name, o.status, o.features, o.legal
    into v_org
    from public.organizations o
   where o.join_token = p_token;
  if not found then
    return json_build_object('ok', false, 'error', 'join_invalid');
  end if;
  if v_org.status not in ('active','trial')
     or coalesce((v_org.features ->> 'self_registration')::boolean, true) = false then
    return json_build_object('ok', false, 'error', 'join_disabled');
  end if;
  -- Ley 1581: el titular debe poder contactar al responsable del tratamiento.
  if coalesce(btrim(v_org.legal ->> 'privacy_email'), '') = '' then
    return json_build_object('ok', false, 'error', 'join_disabled');
  end if;

  -- 2. Rate limit: 20 altas/hora por (org, hash de cliente). El hash lo
  --    calcula el servidor (IP+UA); no guarda la IP en claro.
  if p_client_hash is not null then
    delete from public.join_attempts
     where created_at < now() - interval '1 day';
    select count(*) into v_attempts
      from public.join_attempts
     where organization_id = v_org.id
       and client_hash = p_client_hash
       and created_at > now() - interval '1 hour';
    if v_attempts >= 20 then
      return json_build_object('ok', false, 'error', 'rate_limited');
    end if;
    insert into public.join_attempts (organization_id, client_hash)
    values (v_org.id, p_client_hash);
  end if;

  -- 3. Validación y normalización en servidor
  v_email := lower(btrim(coalesce(p_email, '')));
  v_phone := nullif(btrim(coalesce(p_phone, '')), '');
  if p_first_name is null
     or char_length(btrim(p_first_name)) < 1
     or char_length(p_first_name) > 80 then
    return json_build_object('ok', false, 'error', 'invalid_name');
  end if;
  if char_length(v_email) > 254
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return json_build_object('ok', false, 'error', 'invalid_email');
  end if;
  if v_phone is not null and char_length(v_phone) > 32 then
    return json_build_object('ok', false, 'error', 'invalid_phone');
  end if;

  select p.id, p.name
    into v_prog
    from public.loyalty_programs p
   where p.organization_id = v_org.id and p.status = 'active'
   order by p.created_at
   limit 1;
  if not found then
    return json_build_object('ok', false, 'error', 'no_program');
  end if;

  -- 4. Dedupe: correo ya registrado en ESTE comercio → respuesta neutra.
  select c.id into v_customer
    from public.customers c
   where c.organization_id = v_org.id and lower(c.email) = v_email;
  if found then
    return json_build_object(
      'ok', true, 'existing', true,
      'customer_id', v_customer, 'org_name', v_org.name);
  end if;

  v_version := coalesce(v_org.legal ->> 'consent_version', 'v1');

  -- 5. Alta: cliente + consentimientos + cuenta + tarjeta en una tx.
  --    Carrera concurrente (dos submits a la vez) → unique_violation →
  --    se reintenta por la rama de dedupe (exception handler abajo).
  begin
    insert into public.customers (
      organization_id, first_name, email, phone,
      signup_source, data_consent_at, marketing_consent_at
    ) values (
      v_org.id, btrim(p_first_name), v_email, v_phone,
      'qr', now(), case when p_marketing then now() end
    ) returning id into v_customer;
  exception
    when unique_violation then
      select c.id into v_customer
        from public.customers c
       where c.organization_id = v_org.id and lower(c.email) = v_email;
      return json_build_object(
        'ok', true, 'existing', true,
        'customer_id', v_customer, 'org_name', v_org.name);
  end;

  insert into public.customer_consents (
    organization_id, customer_id, purpose, channel, status,
    text_version, capture_method
  ) values
    (v_org.id, v_customer, 'data_processing', 'web', 'granted',
     v_version, 'join_form'),
    (v_org.id, v_customer, 'marketing_email', 'email',
     case when p_marketing then 'granted' else 'withdrawn' end,
     v_version, 'join_form');

  insert into public.loyalty_accounts (organization_id, customer_id, program_id)
  values (v_org.id, v_customer, v_prog.id)
  on conflict (organization_id, customer_id, program_id) do nothing;
  select id into v_account
    from public.loyalty_accounts
   where organization_id = v_org.id and customer_id = v_customer
     and program_id = v_prog.id;

  insert into public.customer_cards (organization_id, customer_id, account_id)
  values (v_org.id, v_customer, v_account)
  on conflict (account_id) do nothing;
  select token into v_token
    from public.customer_cards where account_id = v_account;

  return json_build_object(
    'ok', true, 'existing', false,
    'card_token', v_token, 'customer_id', v_customer,
    'org_name', v_org.name, 'email', v_email);
end;
$$;
revoke all on function public.register_customer_via_join(text, text, text, text, boolean, text, text) from public;
grant execute on function public.register_customer_via_join(text, text, text, text, boolean, text, text) to anon, authenticated;

-- 3) y 4) close_organization / delete_organization
create or replace function public.close_organization(p_org_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cards int;
begin
  if not public.current_user_has_role(p_org_id, array['owner']) then
    raise exception 'forbidden';
  end if;
  if not exists (select 1 from public.organizations where id = p_org_id and status <> 'closed') then
    raise exception 'already_closed';
  end if;

  update public.organizations set status = 'closed' where id = p_org_id;

  update public.customer_cards
     set status = 'revoked', revoked_at = now()
   where organization_id = p_org_id and status = 'active';
  get diagnostics v_cards = row_count;

  delete from public.push_subscriptions where organization_id = p_org_id;
  update public.push_campaigns set status = 'cancelled'
   where organization_id = p_org_id and status in ('draft', 'scheduled');
  update public.organization_invites set status = 'cancelled'
   where organization_id = p_org_id and status = 'pending';

  return json_build_object('ok', true, 'cards_revoked', v_cards);
end;
$$;

revoke all on function public.close_organization(uuid) from public, anon;
grant execute on function public.close_organization(uuid) to authenticated;

-- ---------- delete_organization ----------------------------------------------

create or replace function public.delete_organization(p_org_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  if not public.current_user_has_role(p_org_id, array['owner']) then
    raise exception 'forbidden';
  end if;

  select slug into v_slug from public.organizations where id = p_org_id;
  if v_slug is null then raise exception 'org_not_found'; end if;
  if v_slug <> btrim(coalesce(p_slug, '')) then raise exception 'slug_mismatch'; end if;

  if exists (select 1 from public.loyalty_transactions where organization_id = p_org_id)
     or exists (select 1 from public.customer_visits where organization_id = p_org_id)
     or exists (select 1 from public.redemptions where organization_id = p_org_id) then
    raise exception 'has_history';
  end if;

  delete from public.organizations where id = p_org_id;
end;
$$;

revoke all on function public.delete_organization(uuid, text) from public, anon;
grant execute on function public.delete_organization(uuid, text) to authenticated;
