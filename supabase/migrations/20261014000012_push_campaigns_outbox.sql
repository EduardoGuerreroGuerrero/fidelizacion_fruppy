-- ============================================================================
-- Web Push por comercio + cola de correo transaccional + derechos del titular
--
--  * push_subscriptions: suscripción técnica por (org, endpoint). La
--    autorización comercial vive aparte (customer_consents /
--    customers.push_consent_state): el permiso del navegador NO equivale a
--    consentimiento publicitario.
--  * push_campaigns + push_deliveries: campañas por comercio con cola,
--    reintentos acotados y elegibilidad re-evaluada en el envío.
--  * email_outbox: cola transaccional idempotente (bienvenida, entrega de
--    tarjeta). El registro no depende del proveedor de correo.
--  * data_rights_requests: solicitudes de titulares (Ley 1581) desde la
--    tarjeta, visibles solo para manager+ de su comercio.
-- ============================================================================

-- ---------- push_subscriptions ------------------------------------------------

create table public.push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth            text not null,
  user_agent      text,
  status          text not null default 'active'
                  check (status in ('active','expired','revoked')),
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  -- Un mismo navegador (endpoint) puede suscribirse a varios comercios:
  -- una fila por comercio, cada una con su propio estado.
  unique (organization_id, endpoint)
);
create index push_subs_org_idx
  on public.push_subscriptions (organization_id, status);
create index push_subs_customer_idx
  on public.push_subscriptions (customer_id);

alter table public.push_subscriptions enable row level security;

-- Los miembros ven las suscripciones de su org (conteo/estado), nunca las
-- claves de otras orgs. Escritura: solo RPCs definer o service_role (envíos).
create policy push_subs_select on public.push_subscriptions
  for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));

grant select on public.push_subscriptions to authenticated;
revoke update, delete on public.push_subscriptions from anon, authenticated;

-- ---------- push_campaigns ----------------------------------------------------

create table public.push_campaigns (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by      uuid references auth.users(id) on delete set null,
  title           text not null check (char_length(title) between 1 and 100),
  body            text not null check (char_length(body) between 1 and 300),
  url             text check (url is null or url ~ '^https://' or url ~ '^/'),
  status          text not null default 'draft'
                  check (status in ('draft','scheduled','sending','sent','cancelled')),
  scheduled_at    timestamptz,
  stats           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  sent_at         timestamptz
);
create index push_campaigns_org_idx
  on public.push_campaigns (organization_id, status, created_at desc);
create trigger push_campaigns_updated_at before update on public.push_campaigns
  for each row execute function public.set_updated_at();

alter table public.push_campaigns enable row level security;

-- Campañas: gestión manager+. Sin DELETE (cancelar = status 'cancelled').
create policy campaigns_select on public.push_campaigns
  for select to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']));
create policy campaigns_insert on public.push_campaigns
  for insert to authenticated
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager'])
              and organization_id in (select public.current_user_org_ids()));
create policy campaigns_update on public.push_campaigns
  for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']))
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager']));

grant select, insert, update on public.push_campaigns to authenticated;

-- ---------- push_deliveries ---------------------------------------------------

create table public.push_deliveries (
  id              bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id     uuid not null references public.push_campaigns(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  status          text not null default 'queued'
                  check (status in ('queued','sent','failed','expired','skipped')),
  attempts        int not null default 0,
  error_code      text,
  created_at      timestamptz not null default now(),
  processed_at    timestamptz,
  unique (campaign_id, subscription_id)
);
create index push_deliveries_queue_idx
  on public.push_deliveries (status, created_at)
  where status = 'queued';
create index push_deliveries_campaign_idx
  on public.push_deliveries (campaign_id, status);

alter table public.push_deliveries enable row level security;

create policy deliveries_select on public.push_deliveries
  for select to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']));

grant select on public.push_deliveries to authenticated;
-- Encolar/marcar solo por RPC definer o service_role (worker de envío).

-- ---------- email_outbox ------------------------------------------------------
-- Cola transaccional: el registro nunca falla por caída del proveedor.
-- El html NO se guarda: se reconstruye en el envío desde kind + payload
-- (mínimo de PII retenida; el card_token ya es secreto por naturaleza).

create table public.email_outbox (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  customer_id     uuid references public.customers(id) on delete cascade,
  kind            text not null check (kind in ('welcome_card','card_delivery')),
  to_email        text not null,
  payload         jsonb not null default '{}'::jsonb,
  status          text not null default 'queued'
                  check (status in ('queued','sent','failed')),
  attempts        int not null default 0,
  last_error      text,
  idempotency_key text not null,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz,
  unique (organization_id, idempotency_key)
);
create index email_outbox_queue_idx
  on public.email_outbox (status, created_at)
  where status = 'queued';

alter table public.email_outbox enable row level security;

create policy outbox_select on public.email_outbox
  for select to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']));

grant select on public.email_outbox to authenticated;

-- ---------- data_rights_requests ----------------------------------------------

create table public.data_rights_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid references public.customers(id) on delete set null,
  request_type    text not null
                  check (request_type in ('access','rectification','erasure','revocation','complaint')),
  detail          text check (detail is null or char_length(detail) <= 2000),
  status          text not null default 'open'
                  check (status in ('open','in_progress','resolved','rejected')),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);
create index rights_requests_org_idx
  on public.data_rights_requests (organization_id, status, created_at desc);

alter table public.data_rights_requests enable row level security;

create policy rights_select on public.data_rights_requests
  for select to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']));
create policy rights_update on public.data_rights_requests
  for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']))
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager'])
              and status in ('in_progress','resolved','rejected'));

grant select, update on public.data_rights_requests to authenticated;

-- El titular envía desde su tarjeta (token = credencial) vía RPC definer.
create or replace function public.submit_rights_request(
  p_token        text,
  p_request_type text,
  p_detail       text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid;
  v_org      uuid;
  v_open     int;
begin
  if p_request_type not in ('access','rectification','erasure','revocation','complaint') then
    return json_build_object('ok', false, 'error', 'invalid_type');
  end if;

  select c.customer_id, c.organization_id
    into v_customer, v_org
    from public.customer_cards c
   where c.token = p_token;
  if not found then
    return json_build_object('ok', false, 'error', 'card_not_found');
  end if;

  -- Antiabuso: máx. 5 solicitudes abiertas por cliente.
  select count(*) into v_open
    from public.data_rights_requests
   where customer_id = v_customer and status in ('open','in_progress');
  if v_open >= 5 then
    return json_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into public.data_rights_requests (
    organization_id, customer_id, request_type, detail
  ) values (
    v_org, v_customer, p_request_type,
    nullif(btrim(coalesce(p_detail, '')), '')
  );

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.submit_rights_request(text, text, text) from public;
grant execute on function public.submit_rights_request(text, text, text) to anon, authenticated;

-- ---------- upsert_push_subscription: alta técnica + autorización ------------
-- El cliente pulsa "Activar notificaciones de {comercio}" en su tarjeta:
-- acción explícita → se registra el consentimiento comercial Y la
-- suscripción técnica, asociados a (org, endpoint).

create or replace function public.upsert_push_subscription(
  p_card_token text,
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_user_agent text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card     record;
  v_sub      uuid;
  v_active   int;
  v_max      int;
  v_version  text;
begin
  select c.customer_id, c.organization_id, c.status,
         o.features, o.limits, o.legal ->> 'consent_version' as consent_version
    into v_card
    from public.customer_cards c
    join public.organizations o on o.id = c.organization_id
   where c.token = p_card_token;
  if not found or v_card.status <> 'active' then
    return json_build_object('ok', false, 'error', 'card_not_found');
  end if;
  if coalesce((v_card.features ->> 'push')::boolean, false) = false then
    return json_build_object('ok', false, 'error', 'push_disabled');
  end if;

  -- Validación básica de la suscripción Push API
  if p_endpoint is null or char_length(p_endpoint) > 1000
     or p_endpoint !~ '^https://' then
    return json_build_object('ok', false, 'error', 'invalid_endpoint');
  end if;
  if p_p256dh is null or p_auth is null
     or char_length(p_p256dh) > 200 or char_length(p_auth) > 100 then
    return json_build_object('ok', false, 'error', 'invalid_keys');
  end if;

  -- Límite de plan: suscriptores activos por comercio (default 5000).
  v_max := coalesce((v_card.limits ->> 'push_max_subscribers')::int, 5000);
  select count(*) into v_active
    from public.push_subscriptions
   where organization_id = v_card.organization_id and status = 'active'
     and endpoint <> p_endpoint;
  if v_active >= v_max then
    return json_build_object('ok', false, 'error', 'plan_limit');
  end if;

  -- Suscripción técnica: una fila por (org, endpoint); re-alta reactiva.
  insert into public.push_subscriptions (
    organization_id, customer_id, endpoint, p256dh, auth, user_agent, status
  ) values (
    v_card.organization_id, v_card.customer_id, p_endpoint, p_p256dh, p_auth,
    nullif(left(coalesce(p_user_agent, ''), 300), ''), 'active'
  )
  on conflict (organization_id, endpoint) do update
     set customer_id = excluded.customer_id,
         p256dh      = excluded.p256dh,
         auth        = excluded.auth,
         user_agent  = excluded.user_agent,
         status      = 'active',
         last_error  = null,
         revoked_at  = null,
         updated_at  = now()
  returning id into v_sub;

  -- Autorización comercial: evento de consentimiento + proyección.
  v_version := coalesce(v_card.consent_version, 'v1');
  insert into public.customer_consents (
    organization_id, customer_id, purpose, channel, status,
    text_version, capture_method
  ) values (
    v_card.organization_id, v_card.customer_id, 'push_notifications', 'push',
    'granted', v_version, 'card_app'
  );
  update public.customers
     set push_consent_state = 'granted', updated_at = now()
   where id = v_card.customer_id;

  return json_build_object('ok', true, 'subscription_id', v_sub);
end;
$$;

revoke all on function public.upsert_push_subscription(text, text, text, text, text) from public;
grant execute on function public.upsert_push_subscription(text, text, text, text, text) to anon, authenticated;

-- ---------- revoke_push_subscription: baja SOLO de este comercio --------------
-- Revoca la autorización comercial y desactiva la fila (org, endpoint).
-- Otras orgs con el mismo endpoint no se ven afectadas.

create or replace function public.revoke_push_subscription(
  p_card_token text,
  p_endpoint   text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card    record;
  v_version text;
begin
  select c.customer_id, c.organization_id,
         o.legal ->> 'consent_version' as consent_version
    into v_card
    from public.customer_cards c
    join public.organizations o on o.id = c.organization_id
   where c.token = p_card_token;
  if not found then
    return json_build_object('ok', false, 'error', 'card_not_found');
  end if;

  update public.push_subscriptions
     set status = 'revoked', revoked_at = now(), updated_at = now()
   where organization_id = v_card.organization_id
     and endpoint = p_endpoint
     and status = 'active';

  v_version := coalesce(v_card.consent_version, 'v1');
  insert into public.customer_consents (
    organization_id, customer_id, purpose, channel, status,
    text_version, capture_method
  ) values (
    v_card.organization_id, v_card.customer_id, 'push_notifications', 'push',
    'withdrawn', v_version, 'card_app'
  );
  update public.customers
     set push_consent_state = 'withdrawn', updated_at = now()
   where id = v_card.customer_id;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.revoke_push_subscription(text, text) from public;
grant execute on function public.revoke_push_subscription(text, text) to anon, authenticated;

-- ---------- campaign_audience_count: destinatarios elegibles -----------------
-- Elegible = suscripción activa + consentimiento comercial vigente +
-- cliente activo. Misma regla que aplica el envío.

create or replace function public.push_audience_count(p_org_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.current_user_has_role(p_org_id, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;
  select count(*) into v_count
    from public.push_subscriptions s
    join public.customers cu
      on cu.id = s.customer_id and cu.status = 'active'
   where s.organization_id = p_org_id
     and s.status = 'active'
     and cu.push_consent_state = 'granted';
  return v_count;
end;
$$;

revoke all on function public.push_audience_count(uuid) from public, anon;
grant execute on function public.push_audience_count(uuid) to authenticated;

-- ---------- queue_push_campaign: borrador/programada → cola -------------------
-- Resuelve la audiencia EN SERVIDOR por el organization_id de la campaña
-- (el frontend nunca elige merchant_id). Límite de campañas/mes por plan.
-- Devuelve el número de destinatarios encolados.

create or replace function public.queue_push_campaign(p_campaign_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_c       record;
  v_count   int;
  v_monthly int;
  v_limit   int;
begin
  select c.*, o.limits
    into v_c
    from public.push_campaigns c
    join public.organizations o on o.id = c.organization_id
   where c.id = p_campaign_id;
  if not found then
    raise exception 'campaign_not_found';
  end if;
  if not public.current_user_has_role(v_c.organization_id, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;
  if v_c.status not in ('draft','scheduled') then
    raise exception 'invalid_status';
  end if;

  -- Límite de plan: campañas encoladas al mes (default 30).
  v_limit := coalesce((v_c.limits ->> 'push_campaigns_per_month')::int, 30);
  select count(*) into v_monthly
    from public.push_campaigns pc
   where pc.organization_id = v_c.organization_id
     and pc.status in ('sending','sent')
     and pc.created_at >= date_trunc('month', now());
  if v_monthly >= v_limit then
    raise exception 'plan_limit';
  end if;

  insert into public.push_deliveries (
    organization_id, campaign_id, subscription_id, status
  )
  select v_c.organization_id, v_c.id, s.id, 'queued'
    from public.push_subscriptions s
    join public.customers cu
      on cu.id = s.customer_id and cu.status = 'active'
   where s.organization_id = v_c.organization_id
     and s.status = 'active'
     and cu.push_consent_state = 'granted'
  on conflict (campaign_id, subscription_id) do nothing;
  get diagnostics v_count = row_count;

  update public.push_campaigns
     set status = 'sending', sent_at = null, updated_at = now()
   where id = v_c.id;

  return v_count;
end;
$$;

revoke all on function public.queue_push_campaign(uuid) from public, anon;
grant execute on function public.queue_push_campaign(uuid) to authenticated;

-- ---------- schedule/cancel helpers -------------------------------------------

create or replace function public.schedule_push_campaign(
  p_campaign_id uuid,
  p_at          timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org
    from public.push_campaigns where id = p_campaign_id;
  if v_org is null then raise exception 'campaign_not_found'; end if;
  if not public.current_user_has_role(v_org, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;
  update public.push_campaigns
     set status = 'scheduled', scheduled_at = p_at, updated_at = now()
   where id = p_campaign_id and status in ('draft','scheduled');
  if not found then raise exception 'invalid_status'; end if;
end;
$$;

create or replace function public.cancel_push_campaign(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org
    from public.push_campaigns where id = p_campaign_id;
  if v_org is null then raise exception 'campaign_not_found'; end if;
  if not public.current_user_has_role(v_org, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;
  update public.push_campaigns
     set status = 'cancelled', updated_at = now()
   where id = p_campaign_id and status in ('draft','scheduled');
  -- Las entregas aún en cola quedan anuladas con la campaña.
  update public.push_deliveries
     set status = 'skipped', processed_at = now()
   where campaign_id = p_campaign_id and status = 'queued';
end;
$$;

revoke all on function public.schedule_push_campaign(uuid, timestamptz) from public, anon;
revoke all on function public.cancel_push_campaign(uuid) from public, anon;
grant execute on function public.schedule_push_campaign(uuid, timestamptz) to authenticated;
grant execute on function public.cancel_push_campaign(uuid) to authenticated;

-- ---------- Endurecimiento: claves de suscripción no legibles por el panel ---
-- Un miembro puede contar/ver el ESTADO de suscripciones de su org, pero
-- p256dh/auth son credenciales de envío: solo las lee service_role (worker).

revoke select on public.push_subscriptions from authenticated;
grant select (
  id, organization_id, customer_id, user_agent,
  status, last_error, created_at, updated_at, revoked_at
) on public.push_subscriptions to authenticated;
