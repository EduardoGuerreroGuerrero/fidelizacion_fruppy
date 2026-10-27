-- ============================================================================
-- Autorregistro por QR con soporte real de multi-programa
--
-- Antes resolve_join/register_customer_via_join tomaban SIEMPRE el programa
-- activo más antiguo (order by created_at limit 1), ignorando cualquier otro
-- programa activo del comercio. Si un negocio corría 2 programas a la vez
-- (p. ej. sellos + puntos), el autorregistro solo matriculaba al cliente en
-- el primero — el segundo quedaba invisible salvo que el equipo emitiera la
-- tarjeta a mano desde el panel (Cliente → Tarjetas → "Emitir tarjeta").
--
-- Ahora:
--  * resolve_join devuelve TODOS los programas activos (`programs: [...]`)
--    para que /join/{token} deje elegir uno o varios con checkboxes.
--  * register_customer_via_join recibe p_program_ids (los seleccionados) y
--    crea una loyalty_account + customer_card por cada uno válido y activo
--    de ESA organización (cualquier id ajeno o inactivo se ignora — nunca se
--    confía en lo que mande el cliente). Si no llega ninguna selección
--    válida, cae al comportamiento histórico (el programa activo más
--    antiguo), para no romper integraciones existentes.
--  * Si el cliente ya existía (mismo correo en el comercio), YA NO se corta
--    el alta: también se le crean las cuentas/tarjetas de los programas
--    nuevos que haya marcado esta vez, sin tocar los que ya tenía.
--  * Alta nueva → devuelve `cards: [{token, program_id, program_name,
--    program_type}]` con EXACTAMENTE los programas seleccionados, para que
--    el correo de bienvenida no mande una tarjeta de otro programa al azar.
--    Cliente YA existente → sigue sin revelar tokens en la respuesta (esta
--    función es ejecutable por `anon`: devolverlos permitiría enumerar la
--    tarjeta de alguien más con solo adivinar su correo). El servidor
--    (route.ts, con supabaseAdmin) resuelve ahí mismo qué tarjetas de los
--    programas seleccionados reenviar por correo.
-- ============================================================================

drop function if exists public.register_customer_via_join(text, text, text, text, boolean, text, text);

create or replace function public.register_customer_via_join(
  p_token           text,
  p_first_name      text,
  p_email           text,
  p_phone           text default null,
  p_marketing       boolean default false,
  p_client_hash     text default null,
  p_idempotency_key text default null,
  p_program_ids     uuid[] default null
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
  v_existing boolean := false;
  v_account  uuid;
  v_token    text;
  v_attempts int;
  v_version  text;
  v_prog_ids uuid[];
  v_cards    json[] := array[]::json[];
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
    -- La limpieza de intentos viejos (> 1 día) la hace el cron diario
    -- (/api/cron/drain), no cada alta.
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

  -- 4. Programas elegidos: solo cuentan los activos de ESTA organización.
  --    Cualquier id ajeno, inactivo o inexistente se descarta en silencio.
  select coalesce(array_agg(p.id order by p.created_at), array[]::uuid[])
    into v_prog_ids
    from public.loyalty_programs p
   where p.organization_id = v_org.id
     and p.status = 'active'
     and (p_program_ids is not null and p.id = any(p_program_ids));

  if array_length(v_prog_ids, 1) is null then
    -- Sin selección válida (no llegó ninguna, o ninguna era de esta org):
    -- respaldo histórico, el programa activo más antiguo.
    select array_agg(p.id order by p.created_at)
      into v_prog_ids
      from public.loyalty_programs p
     where p.organization_id = v_org.id and p.status = 'active';
    if array_length(v_prog_ids, 1) is null then
      return json_build_object('ok', false, 'error', 'no_program');
    end if;
    v_prog_ids := array[v_prog_ids[1]];
  end if;

  -- 5. Dedupe: correo ya registrado en ESTE comercio → se sigue completando
  --    el alta con los programas nuevos, pero no se duplican datos del
  --    cliente ni sus consentimientos.
  select c.id into v_customer
    from public.customers c
   where c.organization_id = v_org.id and lower(c.email) = v_email;
  if found then
    v_existing := true;
  end if;

  v_version := coalesce(v_org.legal ->> 'consent_version', 'v1');

  if not v_existing then
    -- Carrera concurrente (dos submits a la vez) → unique_violation → se
    -- resuelve por la rama de dedupe (exception handler abajo).
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
        v_existing := true;
    end;
  end if;

  if not v_existing then
    insert into public.customer_consents (
      organization_id, customer_id, purpose, channel, status,
      text_version, capture_method
    ) values
      (v_org.id, v_customer, 'data_processing', 'web', 'granted',
       v_version, 'join_form'),
      (v_org.id, v_customer, 'marketing_email', 'email',
       case when p_marketing then 'granted' else 'withdrawn' end,
       v_version, 'join_form');
  end if;

  -- 6. Cuenta + tarjeta por cada programa seleccionado — nuevo o existente:
  --    así un cliente que vuelve a escanear puede sumarse a un programa que
  --    no tenía, sin tocar el que ya tenía. `on conflict do nothing` hace el
  --    paso idempotente si ya existían.
  for v_prog in
    select p.id, p.name, p.program_type
      from public.loyalty_programs p
     where p.id = any(v_prog_ids)
     order by p.created_at
  loop
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

    v_cards := array_append(v_cards, json_build_object(
      'token', v_token,
      'program_id', v_prog.id,
      'program_name', v_prog.name,
      'program_type', v_prog.program_type
    ));
  end loop;

  return json_build_object(
    'ok', true, 'existing', v_existing,
    'customer_id', v_customer, 'org_name', v_org.name, 'email', v_email,
    -- Tokens solo para alta nueva: esta función la puede llamar `anon`, así
    -- que revelarlos para un cliente ya existente permitiría enumerar la
    -- tarjeta de otra persona con solo adivinar su correo.
    'cards', case when v_existing then null else to_json(v_cards) end);
end;
$$;

revoke all on function public.register_customer_via_join(text, text, text, text, boolean, text, text, uuid[]) from public, anon;
grant execute on function public.register_customer_via_join(text, text, text, text, boolean, text, text, uuid[]) to anon, authenticated;

create or replace function public.resolve_join(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org      record;
  v_programs json;
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

  select coalesce(json_agg(json_build_object(
           'id', p.id, 'name', p.name, 'program_type', p.program_type
         ) order by p.created_at), '[]'::json)
    into v_programs
    from public.loyalty_programs p
   where p.organization_id = v_org.id and p.status = 'active';

  if json_array_length(v_programs) = 0 then
    return json_build_object('ok', false, 'reason', 'no_program');
  end if;

  return json_build_object(
    'ok',             true,
    'org_name',       v_org.name,
    'programs',       v_programs,
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
