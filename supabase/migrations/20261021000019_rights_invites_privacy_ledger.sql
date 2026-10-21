-- ============================================================================
-- 0019 · Derechos de titulares, correos de equipo, canal de privacidad y baja
--        de usuarios con ledger inmutable   (QA-A2, A5-A8, A11)
-- ============================================================================
--  A2  Correos transaccionales de invitación al equipo y respuesta a derechos.
--  A6  resolve_rights_request: transiciones válidas (open|in_progress → …).
--  A7  Respuesta obligatoria al cerrar + ejecución real de supresión/revocación
--      (anonimiza al cliente, retira consentimientos, revoca tarjetas, borra
--      suscripciones push y correos en cola). El ledger se conserva sin PII.
--  A8  Sin correo de privacidad configurado no hay autorregistro por QR.
--  A11 Borrar un usuario del panel (auth.users) fallaba: el FK `on delete set
--      null` de performed_by/location_id choca con el trigger append-only.
--      Ahora el trigger tolera SOLO el desvinculado a NULL de esas dos columnas.
-- ============================================================================

-- ---------- A2 · tipos de correo --------------------------------------------

alter table public.email_outbox drop constraint if exists email_outbox_kind_check;
alter table public.email_outbox add constraint email_outbox_kind_check
  check (kind in ('welcome_card','card_delivery','team_invite','rights_response'));

-- ---------- A6/A7 · derechos de los titulares -------------------------------

alter table public.data_rights_requests
  add column if not exists response text
    check (response is null or char_length(response) <= 2000);

-- La resolución pasa SIEMPRE por la RPC (valida transición y ejecuta la
-- acción sobre los datos): sin UPDATE directo para roles de API.
drop policy if exists rights_update on public.data_rights_requests;
revoke update on public.data_rights_requests from authenticated;

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

-- ---------- A8 · canal de privacidad obligatorio para el autorregistro -------

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

create or replace function public.resolve_join(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org  record;
  v_prog record;
begin
  select o.id, o.name, o.status, o.brand, o.legal, o.features
    into v_org
    from public.organizations o
   where o.join_token = p_token;
  if not found then return null; end if;

  if v_org.status not in ('active','trial')
     or coalesce((v_org.features ->> 'self_registration')::boolean, true) = false then
    return json_build_object('ok', false, 'reason', 'unavailable');
  end if;

  -- Sin canal de privacidad no se captan datos personales (Ley 1581).
  if coalesce(btrim(v_org.legal ->> 'privacy_email'), '') = '' then
    return json_build_object('ok', false, 'reason', 'no_privacy_channel');
  end if;

  select p.id, p.name, p.program_type
    into v_prog
    from public.loyalty_programs p
   where p.organization_id = v_org.id and p.status = 'active'
   order by p.created_at
   limit 1;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_program');
  end if;

  return json_build_object(
    'ok',             true,
    'org_name',       v_org.name,
    'program_name',   v_prog.name,
    'program_type',   v_prog.program_type,
    'brand_color',    v_org.brand ->> 'color',
    'logo_url',       v_org.brand ->> 'logo_url',
    'privacy_email',  v_org.legal ->> 'privacy_email',
    'policy_url',     v_org.legal ->> 'policy_url',
    'policy_text',    v_org.legal ->> 'policy_text',
    'data_controller',coalesce(v_org.legal ->> 'data_controller', v_org.name),
    'push_enabled',   coalesce((v_org.features ->> 'push')::boolean, false),
    'location_enabled', coalesce((v_org.features ->> 'location')::boolean, false)
  );
end;
$$;

-- ---------- A11 · baja de usuarios con ledger append-only --------------------
-- Las FK performed_by / location_id son `on delete set null`: el motor ejecuta
-- un UPDATE que el trigger rechazaba. Se permite ÚNICAMENTE desvincular esas
-- dos columnas (poner NULL); cualquier otro cambio o DELETE sigue prohibido.

create or replace function public.prevent_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if (to_jsonb(new) - 'performed_by' - 'location_id')
         = (to_jsonb(old) - 'performed_by' - 'location_id')
       and (new.performed_by is null
            or new.performed_by is not distinct from old.performed_by)
       and (new.location_id is null
            or new.location_id is not distinct from old.location_id) then
      return new;
    end if;
  end if;
  raise exception 'loyalty_transactions es append-only: use un movimiento compensatorio';
end;
$$;

-- Aviso operativo: comercios con QR activo que se quedan sin canal de privacidad.
do $$
declare
  v_orgs text;
begin
  select string_agg(slug, ', ') into v_orgs
    from public.organizations
   where coalesce((features ->> 'self_registration')::boolean, true)
     and coalesce(btrim(legal ->> 'privacy_email'), '') = '';
  if v_orgs is not null then
    raise notice 'ATENCIÓN: sin correo de privacidad (el QR /join queda deshabilitado hasta configurarlo en Configuración → Privacidad): %', v_orgs;
  end if;
end $$;
