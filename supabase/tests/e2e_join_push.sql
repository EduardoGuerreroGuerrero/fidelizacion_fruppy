-- ============================================================================
-- E2E de autorregistro (/join), consentimientos y push por comercio.
-- Autónomo: trae sus propios fixtures (corre alfabéticamente ANTES de
-- e2e_loyalty.sql en la misma base de descarte). Los helpers pg_temp son
-- por sesión, así que se redefinen aquí.
--
-- Mismo requisito previo: stub de auth (auth.users, roles, auth.uid()).
-- ============================================================================

create or replace function pg_temp.t_ok(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if not p_cond then
    raise exception 'E2E_FAIL: %', p_label;
  end if;
  raise notice 'ok - %', p_label;
end $$;

create or replace function pg_temp.t_err(p_sql text, p_pattern text, p_label text)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'E2E_FAIL: % — no lanzó error (esperaba %)', p_label, p_pattern;
exception when others then
  if sqlerrm like 'E2E_FAIL:%' then raise; end if;
  if position(p_pattern in sqlerrm) = 0 then
    raise exception 'E2E_FAIL: % — error "%", esperaba /%/', p_label, sqlerrm, p_pattern;
  end if;
  raise notice 'ok - % (%)', p_label, p_pattern;
end $$;

-- ---------- fixtures: org C (activa) + org D (suspendida) ---------------------

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000c1'),  -- staff  org C
  ('00000000-0000-0000-0000-0000000000c2'),  -- admin  org C
  ('00000000-0000-0000-0000-0000000000c9');  -- staff  org D (cross-org)

insert into public.organizations (id, name, slug, status, features) values
  ('cccccccc-1111-0000-0000-000000000003', 'Org C Join', 'e2e-org-c', 'active', '{}'),
  ('dddddddd-1111-0000-0000-000000000004', 'Org D Susp', 'e2e-org-d', 'suspended', '{}');

insert into public.organization_members (organization_id, user_id, role, status) values
  ('cccccccc-1111-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000c1', 'staff', 'active'),
  ('cccccccc-1111-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000c2', 'admin', 'active'),
  ('dddddddd-1111-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000c9', 'staff', 'active');

insert into public.loyalty_programs
  (id, organization_id, name, program_type, status, stamp_goal) values
  ('eeeeeeee-1111-0000-0000-000000000003', 'cccccccc-1111-0000-0000-000000000003',
   'Sellos C', 'stamps', 'active', 8);

do $e2e$
declare
  U_STAFF_C  constant uuid := '00000000-0000-0000-0000-0000000000c1';
  U_ADMIN_C  constant uuid := '00000000-0000-0000-0000-0000000000c2';
  ORG_C      constant uuid := 'cccccccc-1111-0000-0000-000000000003';
  ORG_D      constant uuid := 'dddddddd-1111-0000-0000-000000000004';

  v_join_c   text;
  v_join_d   text;
  r          json;
  v_card_tok text;
  v_cust     uuid;
  v_cust2    uuid;
  n          int;
  b          boolean;
  v_camp     uuid;
  v_tok2     text;
begin
  select join_token into v_join_c from public.organizations where id = ORG_C;
  select join_token into v_join_d from public.organizations where id = ORG_D;

  -- --- J01 resolve_join ---
  r := public.resolve_join(v_join_c);
  perform pg_temp.t_ok((r->>'ok')::boolean and r->>'org_name' = 'Org C Join'
                       and r->>'program_name' = 'Sellos C',
                       'J01a resolve_join devuelve marca y programa');
  perform pg_temp.t_ok(public.resolve_join(repeat('f', 32)) is null,
                       'J01b token inexistente → null');
  r := public.resolve_join(v_join_d);
  perform pg_temp.t_ok((r->>'ok')::boolean = false and r->>'reason' = 'unavailable',
                       'J01c org suspendida → no disponible');

  -- --- J02 registro correcto ---
  r := public.register_customer_via_join(
         v_join_c, '  ana prueba ', 'Ana@Test.co', '+57 300 1112233',
         false, 'hash-j02', 'j02-1');
  perform pg_temp.t_ok((r->>'ok')::boolean and (r->>'existing')::boolean = false
                       and r->>'card_token' is not null,
                       'J02a alta devuelve token de tarjeta');
  v_card_tok := r->>'card_token';
  v_cust := (r->>'customer_id')::uuid;

  select count(*) into n from public.customers
   where organization_id = ORG_C and lower(email) = 'ana@test.co';
  perform pg_temp.t_ok(n = 1, 'J02b un cliente en la org, email normalizado');

  perform pg_temp.t_ok(
    (select c.signup_source = 'qr' and c.data_consent_at is not null
            and c.marketing_consent_at is null
       from public.customers c where c.id = v_cust),
    'J02c origen qr + consent. de datos, marketing sin marcar');

  perform pg_temp.t_ok(
    (select count(*) from public.customer_consents
      where customer_id = v_cust) = 2
    and (select e.status from public.customer_consents e
          where e.customer_id = v_cust and e.purpose = 'marketing_email') = 'withdrawn'
    and (select e.status from public.customer_consents e
          where e.customer_id = v_cust and e.purpose = 'data_processing') = 'granted',
    'J02d eventos de consentimiento separados por finalidad');

  perform pg_temp.t_ok(
    (select cc.token = v_card_tok
       from public.customer_cards cc
       join public.loyalty_accounts a on a.id = cc.account_id
      where cc.customer_id = v_cust and a.program_id is not null),
    'J02e cuenta y tarjeta creadas en la misma tx');

  -- --- J03 dedupe: mismo correo → existing, sin tarjeta en la respuesta ---
  r := public.register_customer_via_join(v_join_c, 'Ana Otra', 'ana@test.co',
                                         null, true, 'hash-j03', 'j03-1');
  perform pg_temp.t_ok((r->>'ok')::boolean and (r->>'existing')::boolean = true
                       and r->>'card_token' is null,
                       'J03a correo duplicado → existing sin filtrar tarjeta');
  perform pg_temp.t_ok(
    (select count(*) from public.customers where organization_id = ORG_C) = 1,
    'J03b no se creó duplicado');

  -- --- J04 variante de mayúsculas también deduplica ---
  r := public.register_customer_via_join(v_join_c, 'Ana', 'ANA@TEST.CO',
                                         null, false, 'hash-j04', 'j04-1');
  perform pg_temp.t_ok((r->>'existing')::boolean = true,
                       'J04 dedupe insensible a mayúsculas');

  -- --- J05 validaciones ---
  r := public.register_customer_via_join(v_join_c, '', 'x@y.co', null, false, null, null);
  perform pg_temp.t_ok((r->>'ok')::boolean = false and r->>'error' = 'invalid_name',
                       'J05a nombre vacío rechazado');
  r := public.register_customer_via_join(v_join_c, 'X', 'no-es-email', null, false, null, null);
  perform pg_temp.t_ok(r->>'error' = 'invalid_email', 'J05b email inválido');
  r := public.register_customer_via_join('ffffffffffffffffffffffffffffffff',
                                         'X', 'x@y.co', null, false, null, null);
  perform pg_temp.t_ok(r->>'error' = 'join_invalid', 'J05c token inválido');
  r := public.register_customer_via_join(v_join_d, 'X', 'x@y.co', null, false, null, null);
  perform pg_temp.t_ok(r->>'error' = 'join_disabled', 'J05d org suspendida no registra');

  -- --- J06 rate limit por (org, hash) ---
  insert into public.join_attempts (organization_id, client_hash)
  select ORG_C, 'hash-rl' from generate_series(1, 20);
  r := public.register_customer_via_join(v_join_c, 'Spam', 's@y.co',
                                         null, false, 'hash-rl', null);
  perform pg_temp.t_ok(r->>'error' = 'rate_limited',
                       'J06 21º intento/hora bloqueado');
  -- otro hash del mismo comercio sigue funcionando
  r := public.register_customer_via_join(v_join_c, 'Ben', 'ben@test.co',
                                         null, false, 'hash-ok', 'j06-2');
  perform pg_temp.t_ok((r->>'ok')::boolean, 'J06b otro cliente no afectado');
  v_cust2 := (r->>'customer_id')::uuid;

  -- --- J07 rotación del join token (solo admin+) ---
  perform set_config('app.user_id', U_STAFF_C::text, false);
  perform pg_temp.t_err(
    format('select public.rotate_join_token(%L)', ORG_C),
    'forbidden', 'J07a staff no rota el token');
  perform set_config('app.user_id', U_ADMIN_C::text, false);
  select public.rotate_join_token(ORG_C) <> v_join_c into b;
  perform pg_temp.t_ok(b, 'J07b admin rota el token');
  perform pg_temp.t_ok(public.resolve_join(v_join_c) is null,
                       'J07c el QR viejo muere al instante');
  select join_token into v_join_c from public.organizations where id = ORG_C;

  -- --- J08 consentimiento desde la tarjeta ---
  r := public.get_card_consents(v_card_tok);
  perform pg_temp.t_ok(r->'consents'->>'marketing_email' = 'withdrawn',
                       'J08a estado inicial marketing = withdrawn');
  r := public.set_card_consent(v_card_tok, 'marketing_email', true);
  perform pg_temp.t_ok((r->>'ok')::boolean and r->>'status' = 'granted',
                       'J08b opt-in de marketing desde la tarjeta');
  perform pg_temp.t_ok(
    (select c.marketing_consent_at is not null
       from public.customers c where c.id = v_cust),
    'J08c proyección marketing_consent_at actualizada');
  r := public.set_card_consent(v_card_tok, 'marketing_email', false);
  perform pg_temp.t_ok(
    (r->>'ok')::boolean
    and (select c.marketing_consent_at is null
           from public.customers c where c.id = v_cust),
    'J08d retiro de marketing limpia la proyección');
  r := public.set_card_consent(v_card_tok, 'data_processing', false);
  perform pg_temp.t_ok(r->>'error' = 'invalid_purpose',
                       'J08e tratamiento de datos no se retira por esta vía');

  -- --- J09 push deshabilitado por defecto ---
  r := public.upsert_push_subscription(v_card_tok, 'https://push.example/e1',
                                       repeat('k', 88), repeat('a', 22), 'UA');
  perform pg_temp.t_ok(r->>'error' = 'push_disabled',
                       'J09 feature flag push off → rechazado');
  update public.organizations
     set features = features || '{"push": true}'::jsonb
   where id = ORG_C;

  -- --- J10 suscripción + autorización comercial separadas pero vinculadas ---
  r := public.upsert_push_subscription(v_card_tok, 'https://push.example/e1',
                                       repeat('k', 88), repeat('a', 22), 'UA');
  perform pg_temp.t_ok((r->>'ok')::boolean, 'J10a suscripción aceptada');
  perform pg_temp.t_ok(
    (select s.status = 'active' from public.push_subscriptions s
      where s.organization_id = ORG_C and s.endpoint = 'https://push.example/e1')
    and (select cu.push_consent_state = 'granted'
           from public.customers cu where cu.id = v_cust),
    'J10b fila activa + proyección granted');
  perform pg_temp.t_ok(
    (select count(*) from public.push_subscriptions where organization_id = ORG_C) = 1,
    'J10c una fila por (org, endpoint)');
  -- re-alta con otro cliente sobre el mismo endpoint → misma fila, nuevo dueño
  select cc.token into v_tok2
    from public.customer_cards cc
   where cc.customer_id = v_cust2
   limit 1;
  r := public.upsert_push_subscription(v_tok2, 'https://push.example/e1',
                                       'k2', 'a2', 'UA2');
  perform pg_temp.t_ok((r->>'ok')::boolean, 'J10d re-alta por otro cliente');
  perform pg_temp.t_ok(
    (select count(*) from public.push_subscriptions
      where organization_id = ORG_C and endpoint = 'https://push.example/e1') = 1,
    'J10d mismo endpoint no duplica la fila');

  -- --- J11 audiencia por comercio ---
  perform set_config('app.user_id', U_STAFF_C::text, false);
  perform pg_temp.t_ok(public.push_audience_count(ORG_C) = 1,
                       'J11a audiencia = suscripción activa + consent granted');
  perform set_config('app.user_id', '00000000-0000-0000-0000-0000000000c9', false);
  perform pg_temp.t_err(
    format('select public.push_audience_count(%L)', ORG_C),
    'forbidden', 'J11b staff de otra org no consulta audiencia ajena');
  perform set_config('app.user_id', U_ADMIN_C::text, false);

  -- --- J12 campaña: crear (RLS), encolar, cancelar ---
  insert into public.push_campaigns (organization_id, created_by, title, body, url)
  values (ORG_C, U_ADMIN_C, 'Promo', 'Doble sello hoy', '/t/abc')
  returning id into v_camp;
  perform pg_temp.t_ok(public.queue_push_campaign(v_camp) = 1,
                       'J12a cola la campaña a 1 destinatario elegible');
  perform pg_temp.t_ok(
    (select count(*) from public.push_deliveries
      where campaign_id = v_camp and status = 'queued') = 1
    and (select c.status = 'sending' from public.push_campaigns c where c.id = v_camp),
    'J12b una entrega en cola y campaña sending');
  perform pg_temp.t_err(
    format('select public.queue_push_campaign(%L)', v_camp),
    'invalid_status', 'J12c no se re-encola una campaña en envío');
  perform set_config('app.user_id', '00000000-0000-0000-0000-0000000000c9', false);
  perform pg_temp.t_err(
    format('select public.queue_push_campaign(%L)', v_camp),
    'forbidden', 'J12d staff de otra org no encola campañas ajenas');
  perform set_config('app.user_id', U_ADMIN_C::text, false);

  -- baja ANTES del envío: la elegibilidad dejó de contarla
  r := public.revoke_push_subscription(v_card_tok, 'https://push.example/e1');
  perform pg_temp.t_ok((r->>'ok')::boolean
    and (select cu.push_consent_state = 'withdrawn'
           from public.customers cu where cu.id = v_cust),
    'J12e baja de push retira consent + desactiva fila');
  perform pg_temp.t_ok(public.push_audience_count(ORG_C) = 0,
                       'J12f audiencia queda en 0 tras la baja');
  -- el envío re-evalúa: al worker leer deliveries queued + consent, esta
  -- entrega se marcará 'skipped' (verificado en la ruta /api/cron/push).

  -- --- J13 solicitudes de derechos desde la tarjeta ---
  r := public.submit_rights_request(v_card_tok, 'access', 'Quiero copia de mis datos');
  perform pg_temp.t_ok((r->>'ok')::boolean
    and (select count(*) from public.data_rights_requests
          where customer_id = v_cust and request_type = 'access' and status = 'open') = 1,
    'J13a solicitud registrada para su comercio');
  r := public.submit_rights_request('ffffffffffffffffffffffffffffffff', 'access', null);
  perform pg_temp.t_ok(r->>'error' = 'card_not_found', 'J13b token inválido');
  insert into public.data_rights_requests (organization_id, customer_id, request_type)
  select ORG_C, v_cust, 'access' from generate_series(1, 5);
  r := public.submit_rights_request(v_card_tok, 'access', null);
  perform pg_temp.t_ok(r->>'error' = 'rate_limited',
                       'J13c antiabuso: máx. 5 abiertas');
end $e2e$;

-- ---------- J14 · RLS a nivel tabla (rol no-superuser) ------------------------

grant authenticated to current_user;

set role authenticated;
select set_config('app.user_id', '00000000-0000-0000-0000-0000000000c9', false);
do $$
declare n int;
begin
  select count(*) into n from public.push_subscriptions
   where organization_id = 'cccccccc-1111-0000-0000-000000000003';
  perform pg_temp.t_ok(n = 0, 'J14a RLS: staff B ve 0 suscripciones de org C');
  select count(*) into n from public.customer_consents
   where organization_id = 'cccccccc-1111-0000-0000-000000000003';
  perform pg_temp.t_ok(n = 0, 'J14b RLS: staff B ve 0 consentimientos de org C');
  select count(*) into n from public.push_campaigns
   where organization_id = 'cccccccc-1111-0000-0000-000000000003';
  perform pg_temp.t_ok(n = 0, 'J14c RLS: staff B ve 0 campañas de org C');
end $$;

select set_config('app.user_id', '00000000-0000-0000-0000-0000000000c1', false);
do $$
declare n int;
begin
  select count(*) into n from public.push_subscriptions
   where organization_id = 'cccccccc-1111-0000-0000-000000000003';
  perform pg_temp.t_ok(n = 1, 'J14d RLS: staff C sí ve sus suscripciones');
  -- staff (sin manager+) no puede insertar campañas aunque pase la UI
  begin
    insert into public.push_campaigns (organization_id, title, body)
    values ('cccccccc-1111-0000-0000-000000000003', 'x', 'x');
    raise exception 'E2E_FAIL: J14e staff insertó campaña';
  exception when others then
    if sqlerrm like 'E2E_FAIL:%' then raise; end if;
    raise notice 'ok - J14e staff no inserta campañas (RLS)';
  end;
end $$;
reset role;

do $$ begin raise notice '===== E2E JOIN/PUSH: TODOS LOS TESTS PASARON ====='; end $$;
