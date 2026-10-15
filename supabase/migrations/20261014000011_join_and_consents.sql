-- ============================================================================
-- Autorregistro por QR (/join/{join_token}) + consentimientos auditables
--
--  * organizations.join_token: QR público del local (128 bits), rotable.
--    organizations.legal/features/limits jsonb: config legal, feature flags
--    por tenant y límites de plan (sin columnas nuevas por cada flag).
--  * customers.signup_source: origen del alta ('admin'|'qr'|'import').
--  * customers.push_consent_state: proyección rápida del estado push
--    (la evidencia auditable vive en customer_consents).
--  * customer_consents: eventos append-only por finalidad/canal — demuestra
--    cuándo y qué texto aceptó el titular (Ley 1581, consent. verificable).
--  * join_attempts: rate limit del formulario público por (org, hash cliente).
--  * locations.lat/lng: coordenadas opcionales de sede para "cercanas".
--  * RPCs públicas por token: resolve_join, register_customer_via_join,
--    get_card_consents, set_card_consent. El token de tarjeta/join ES la
--    credencial; las funciones devuelven solo lo necesario.
-- ============================================================================

-- ---------- organizations: join token + config legal/flags/límites -----------

alter table public.organizations
  add column if not exists join_token text,
  add column if not exists legal    jsonb not null default '{}'::jsonb,
  add column if not exists features jsonb not null default '{}'::jsonb,
  add column if not exists limits   jsonb not null default '{}'::jsonb;

comment on column public.organizations.join_token is
  'Token público del QR de autorregistro (/join/{token}). Rotable; no es slug.';
comment on column public.organizations.legal is
  '{"privacy_email","policy_url","data_controller","consent_version"}';
comment on column public.organizations.features is
  'Flags por tenant: {"self_registration","push","location","wallet"} bool.';
comment on column public.organizations.limits is
  'Límites de plan: {"push_campaigns_per_month","push_max_subscribers"}.';

-- Token por org existente (volatile → valor distinto por fila) y para futuras.
update public.organizations
   set join_token = replace(gen_random_uuid()::text, '-', '')
 where join_token is null;
alter table public.organizations
  alter column join_token set default replace(gen_random_uuid()::text, '-', ''),
  alter column join_token set not null;
create unique index if not exists organizations_join_token_uidx
  on public.organizations (join_token);

-- ---------- customers: origen del alta + proyección de consentimiento push --

alter table public.customers
  add column if not exists signup_source text not null default 'admin'
    check (signup_source in ('admin','qr','import')),
  add column if not exists push_consent_state text
    check (push_consent_state is null or push_consent_state in ('granted','withdrawn'));

-- Unicidad por correo normalizado dentro del comercio (regla de negocio del
-- autorregistro; soporta clientes sin correo porque el índice es parcial).
create unique index if not exists customers_org_email_uidx
  on public.customers (organization_id, lower(email))
  where email is not null;

-- ---------- customer_consents: evidencia auditable por finalidad -------------

create table public.customer_consents (
  id              bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete cascade,
  purpose         text not null check (purpose in
                    ('data_processing','marketing_email','push_notifications','location')),
  channel         text not null check (channel in ('web','email','push','location')),
  status          text not null check (status in ('granted','withdrawn')),
  text_version    text not null default 'v1',
  capture_method  text not null default 'join_form'
                  check (capture_method in ('join_form','card_app','admin','import')),
  evidence        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index consents_customer_idx
  on public.customer_consents (organization_id, customer_id, purpose, created_at desc);

alter table public.customer_consents enable row level security;

-- Los miembros leen los consentimientos de su org; escribir solo por RPC.
create policy consents_select on public.customer_consents
  for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));

grant select on public.customer_consents to authenticated;
-- Sin INSERT/UPDATE/DELETE para roles de API: la evidencia es append-only
-- y solo la generan las RPCs security definer / el servicio.
revoke update, delete on public.customer_consents from anon, authenticated;

-- Estado vigente de una finalidad (último evento). Interna: solo la llaman
-- otras funciones definer; sin grant a roles de API para no exponer estado
-- de clientes ajenos por id arbitrario.
create or replace function public.consent_state(
  p_customer_id uuid,
  p_purpose     text
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select c.status
    from public.customer_consents c
   where c.customer_id = p_customer_id
     and c.purpose = p_purpose
   order by c.created_at desc, c.id desc
   limit 1;
$$;

revoke all on function public.consent_state(uuid, text) from public, anon, authenticated;

-- ---------- join_attempts: rate limit del formulario público -----------------

create table public.join_attempts (
  id              bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_hash     text not null,
  created_at      timestamptz not null default now()
);
create index join_attempts_idx
  on public.join_attempts (organization_id, client_hash, created_at desc);

-- Nadie accede vía API: solo las RPCs definer la leen/escriben.
alter table public.join_attempts enable row level security;

-- ---------- sedes: coordenadas opcionales ------------------------------------

alter table public.locations
  add column if not exists lat numeric(9,6)
    check (lat is null or lat between -90 and 90),
  add column if not exists lng numeric(9,6)
    check (lng is null or lng between -180 and 180);

-- ---------- resolve_join: datos públicos del comercio del QR -----------------
-- Devuelve null para token inválido; {ok:false} para comercio no elegible.
-- Solo expone lo que el formulario necesita mostrar (marca + aviso legal).

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
    'data_controller',v_org.legal ->> 'data_controller',
    'push_enabled',   coalesce((v_org.features ->> 'push')::boolean, false),
    'location_enabled', coalesce((v_org.features ->> 'location')::boolean, false)
  );
end;
$$;

revoke all on function public.resolve_join(text) from public;
grant execute on function public.resolve_join(text) to anon, authenticated;

-- ---------- rotate_join_token: regenerar el QR ante abuso --------------------

create or replace function public.rotate_join_token(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if not public.current_user_has_role(p_org_id, array['owner','admin']) then
    raise exception 'forbidden';
  end if;
  update public.organizations
     set join_token = replace(gen_random_uuid()::text, '-', '')
   where id = p_org_id
   returning join_token into v_token;
  return v_token;
end;
$$;

revoke all on function public.rotate_join_token(uuid) from public, anon;
grant execute on function public.rotate_join_token(uuid) to authenticated;

-- ---------- register_customer_via_join: alta atómica y deduplicada ----------
-- Resuelve la org por el join token (el cliente NUNCA envía merchant_id).
-- Email ya registrado → devuelve existing=true sin exponer la tarjeta; el
-- servidor decide encolar el correo de entrega al email en archivo.
-- Todo (cliente + consentimientos + cuenta + tarjeta) en una sola tx.

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

-- ---------- get_card_consents: preferencias vigentes del cliente -------------
-- Estado por finalidad según el último evento de customer_consents +
-- proyección de marketing para coherencia con el CRM del comercio.

create or replace function public.get_card_consents(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid;
  v_org      uuid;
  v_org_name text;
  v_features jsonb;
begin
  select c.customer_id, c.organization_id, o.name, o.features
    into v_customer, v_org, v_org_name, v_features
    from public.customer_cards c
    join public.organizations o on o.id = c.organization_id
   where c.token = p_token;
  if not found then return null; end if;

  return json_build_object(
    'org_name', v_org_name,
    'push_enabled',     coalesce((v_features ->> 'push')::boolean, false),
    'location_enabled', coalesce((v_features ->> 'location')::boolean, false),
    'consents', (
      select coalesce(jsonb_object_agg(purpose, status), '{}'::jsonb)
        from (
          select distinct on (c.purpose) c.purpose, c.status
            from public.customer_consents c
           where c.customer_id = v_customer
           order by c.purpose, c.created_at desc, c.id desc
        ) latest
    )
  );
end;
$$;

revoke all on function public.get_card_consents(text) from public;
grant execute on function public.get_card_consents(text) to anon, authenticated;

-- ---------- set_card_consent: otorgar/retirar una finalidad ------------------
-- Cada decisión queda como evento auditable; las proyecciones de customers
-- (marketing_consent_at, push_consent_state) se actualizan en la misma tx.
-- La autorización de tratamiento de datos NO puede retirarse por esta vía:
-- la supresión se gestiona como solicitud de derechos.

create or replace function public.set_card_consent(
  p_token   text,
  p_purpose text,
  p_granted boolean
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid;
  v_org      uuid;
  v_version  text;
begin
  if p_purpose not in ('marketing_email','push_notifications','location') then
    return json_build_object('ok', false, 'error', 'invalid_purpose');
  end if;

  select c.customer_id, c.organization_id, o.legal ->> 'consent_version'
    into v_customer, v_org, v_version
    from public.customer_cards c
    join public.organizations o on o.id = c.organization_id
   where c.token = p_token;
  if not found then
    return json_build_object('ok', false, 'error', 'card_not_found');
  end if;

  insert into public.customer_consents (
    organization_id, customer_id, purpose, channel, status,
    text_version, capture_method
  ) values (
    v_org, v_customer, p_purpose,
    case p_purpose
      when 'marketing_email' then 'email'
      when 'push_notifications' then 'push'
      else 'location' end,
    case when p_granted then 'granted' else 'withdrawn' end,
    coalesce(v_version, 'v1'), 'card_app'
  );

  if p_purpose = 'marketing_email' then
    update public.customers
       set marketing_consent_at = case when p_granted then now() else null end,
           updated_at = now()
     where id = v_customer;
  elsif p_purpose = 'push_notifications' then
    update public.customers
       set push_consent_state = case when p_granted then 'granted' else 'withdrawn' end,
           updated_at = now()
     where id = v_customer;
  end if;

  return json_build_object('ok', true, 'purpose', p_purpose,
                           'status', case when p_granted then 'granted' else 'withdrawn' end);
end;
$$;

revoke all on function public.set_card_consent(text, text, boolean) from public;
grant execute on function public.set_card_consent(text, text, boolean) to anon, authenticated;

-- ---------- record_card_consent: ahora también deja evidencia ----------------
-- Misma firma/semántica (idempotente, primer timestamp se conserva) y además
-- inserta los eventos en customer_consents una sola vez por cliente.

create or replace function public.record_card_consent(p_token text, p_marketing boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid;
  v_org      uuid;
  v_version  text;
begin
  select cu.id, cu.organization_id, o.legal ->> 'consent_version'
    into v_customer, v_org, v_version
    from public.customer_cards c
    join public.customers cu on cu.id = c.customer_id
    join public.organizations o on o.id = c.organization_id
   where c.token = p_token;
  if not found then return false; end if;

  update public.customers
     set data_consent_at      = coalesce(data_consent_at, now()),
         marketing_consent_at = case when p_marketing
                                  then coalesce(marketing_consent_at, now())
                                  else marketing_consent_at end,
         updated_at           = now()
   where id = v_customer;

  -- Evidencia por finalidad, solo si aún no hay evento de esa finalidad
  -- (idempotente como el resto de la función).
  insert into public.customer_consents (
    organization_id, customer_id, purpose, channel, status,
    text_version, capture_method
  )
  select v_org, v_customer, 'data_processing', 'web', 'granted',
         coalesce(v_version, 'v1'), 'card_app'
   where not exists (
     select 1 from public.customer_consents e
      where e.customer_id = v_customer and e.purpose = 'data_processing');

  insert into public.customer_consents (
    organization_id, customer_id, purpose, channel, status,
    text_version, capture_method
  )
  select v_org, v_customer, 'marketing_email', 'email',
         'granted', coalesce(v_version, 'v1'), 'card_app'
   where p_marketing and not exists (
     select 1 from public.customer_consents e
      where e.customer_id = v_customer and e.purpose = 'marketing_email');

  return true;
end;
$$;

revoke all on function public.record_card_consent(text, boolean) from public;
grant execute on function public.record_card_consent(text, boolean) to anon, authenticated;

-- ---------- get_card_app_data: sedes con coordenadas + flag de ubicación -----
-- lat/lng permiten ordenar "cercanas" en el cliente sin enviar la posición
-- del titular al servidor (privacidad por diseño: la distancia se calcula
-- en el navegador y nada se persiste).

create or replace function public.get_card_app_data(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
begin
  select c.status, c.organization_id, c.customer_id,
         o.name as org_name, o.features, cu.first_name, cu.data_consent_at,
         p.id as program_id, p.name as program_name, p.program_type,
         p.stamp_goal, p.reward_description,
         a.current_stamps, a.current_points
    into v
    from public.customer_cards c
    join public.organizations o on o.id = c.organization_id
    join public.customers cu on cu.id = c.customer_id
    join public.loyalty_accounts a on a.id = c.account_id
    join public.loyalty_programs p on p.id = a.program_id
   where c.token = p_token;
  if not found then return null; end if;

  return json_build_object(
    'org_name',           v.org_name,
    'first_name',         v.first_name,
    'program_name',       v.program_name,
    'program_type',       v.program_type,
    'stamp_goal',         v.stamp_goal,
    'reward_description', v.reward_description,
    'current_stamps',     v.current_stamps,
    'current_points',     v.current_points,
    'card_status',        v.status,
    'consent_pending',    v.data_consent_at is null,
    'location_enabled',   coalesce((v.features ->> 'location')::boolean, false),
    -- Wallet queda activo por defecto (comportamiento previo): solo un
    -- features.wallet=false explícito lo desactiva para ese comercio.
    'wallet_enabled',     coalesce((v.features ->> 'wallet')::boolean, true),
    'rewards', (
      select coalesce(json_agg(json_build_object(
        'id',          r.id,
        'name',        r.name,
        'description', r.description,
        'cost_stamps', r.cost_stamps,
        'cost_points', r.cost_points,
        'terms',       r.terms
      ) order by r.cost_stamps asc nulls last, r.cost_points asc nulls last, r.name), '[]'::json)
      from public.rewards r
      where r.program_id = v.program_id and r.status = 'active'
    ),
    'locations', (
      select coalesce(json_agg(json_build_object(
        'id',      l.id,
        'name',    l.name,
        'address', l.address,
        'lat',     l.lat,
        'lng',     l.lng
      ) order by l.name), '[]'::json)
      from public.locations l
      where l.organization_id = v.organization_id and l.status = 'active'
    ),
    'visits', (
      select coalesce(json_agg(json_build_object(
        'visited_at', vv.created_at,
        'location',   vv.location_name,
        'stamps',     vv.stamps_delta
      ) order by vv.created_at desc), '[]'::json)
      from (
        select cv.created_at, l.name as location_name,
               coalesce(t.stamps_delta, 0) as stamps_delta
          from public.customer_visits cv
          left join public.locations l on l.id = cv.location_id
          left join public.loyalty_transactions t
            on t.organization_id = cv.organization_id
           and t.idempotency_key = cv.idempotency_key
           and t.transaction_type = 'earn'
         where cv.customer_id = v.customer_id
           and cv.organization_id = v.organization_id
         order by cv.created_at desc
         limit 5
      ) vv
    ),
    'redemptions', (
      select coalesce(json_agg(json_build_object(
        'id',          rr.id,
        'reward',      rr.reward_name,
        'redeemed_at', rr.created_at,
        'location',    rr.location_name
      ) order by rr.created_at desc), '[]'::json)
      from (
        select rd.id, r.name as reward_name, rd.created_at, l.name as location_name
          from public.redemptions rd
          join public.rewards r on r.id = rd.reward_id
          left join public.locations l on l.id = rd.location_id
         where rd.customer_id = v.customer_id and rd.status = 'completed'
         order by rd.created_at desc
         limit 10
      ) rr
    )
  );
end;
$$;

revoke all on function public.get_card_app_data(text) from public;
grant execute on function public.get_card_app_data(text) to anon, authenticated;

-- ---------- admin_set_customer_consent: evidencia cuando el equipo gestiona --
-- El equipo puede registrar una baja/alta de marketing a petición del
-- titular (ej. "quítenme del correo" dicho en caja), pero queda como evento
-- con capture_method 'admin' — no se reescribe la historia del titular.

create or replace function public.admin_set_customer_consent(
  p_customer_id uuid,
  p_purpose     text,
  p_granted     boolean
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org     uuid;
  v_version text;
begin
  -- Solo marketing por correo: push/ubicación/tratamiento los gestiona el
  -- titular o el flujo técnico (suscripción, formulario público).
  if p_purpose <> 'marketing_email' then
    return json_build_object('ok', false, 'error', 'invalid_purpose');
  end if;

  select c.organization_id, o.legal ->> 'consent_version'
    into v_org, v_version
    from public.customers c
    join public.organizations o on o.id = c.organization_id
   where c.id = p_customer_id;
  if v_org is null then
    return json_build_object('ok', false, 'error', 'customer_not_found');
  end if;
  if not public.current_user_has_role(v_org, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;

  insert into public.customer_consents (
    organization_id, customer_id, purpose, channel, status,
    text_version, capture_method
  ) values (
    v_org, p_customer_id, 'marketing_email', 'email',
    case when p_granted then 'granted' else 'withdrawn' end,
    coalesce(v_version, 'v1'), 'admin'
  );

  update public.customers
     set marketing_consent_at = case when p_granted then now() else null end,
         updated_at = now()
   where id = p_customer_id;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.admin_set_customer_consent(uuid, text, boolean) from public, anon;
grant execute on function public.admin_set_customer_consent(uuid, text, boolean) to authenticated;
