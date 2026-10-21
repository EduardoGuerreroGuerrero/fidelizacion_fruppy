-- ============================================================================
-- E2E derechos de titulares, canal de privacidad y baja de usuarios
-- (QA-A5..A8, QA-A11). Autónomo: trae sus propios fixtures. Requisito previo:
-- stub de auth (auth.users, roles, auth.uid() leyendo app.user_id).
-- ============================================================================

select set_config('app.user_id', '', false);

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

-- ---------- fixtures: org R (con privacidad) y org S (sin privacidad) --------

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000d1'),  -- admin R
  ('00000000-0000-0000-0000-0000000000d2'),  -- manager R
  ('00000000-0000-0000-0000-0000000000d3'),  -- staff R
  ('00000000-0000-0000-0000-0000000000d4'),  -- owner R
  ('00000000-0000-0000-0000-0000000000d5');  -- owner S

insert into public.organizations (id, name, slug, legal) values
  ('a0a0a0a0-0000-0000-0000-000000000001', 'Org R Derechos', 'e2e-org-r',
   '{"privacy_email":"privacidad@org-r.test"}'),
  ('a0a0a0a0-0000-0000-0000-000000000002', 'Org S Sin Privacidad', 'e2e-org-s', '{}');

insert into public.organization_members (organization_id, user_id, role) values
  ('a0a0a0a0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d4', 'owner'),
  ('a0a0a0a0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d1', 'admin'),
  ('a0a0a0a0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d2', 'manager'),
  ('a0a0a0a0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d3', 'staff'),
  ('a0a0a0a0-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000d5', 'owner');

insert into public.loyalty_programs (id, organization_id, name, program_type, stamp_goal) values
  ('b0b0b0b0-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001',
   'Sellos R', 'stamps', 5),
  ('b0b0b0b0-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000002',
   'Sellos S', 'stamps', 5);

-- Cliente con TODO el rastro de datos personales (para erasure/revocation).
insert into public.customers (id, organization_id, first_name, last_name, email, phone, birth_date, marketing_consent_at)
select ('c0c0c0c0-0000-0000-0000-00000000000' || n)::uuid,
       'a0a0a0a0-0000-0000-0000-000000000001',
       'Cliente' || n, 'Apellido', 'cli' || n || '@example.test', '+57300000000' || n,
       date '1990-01-01', now()
  from generate_series(1, 2) n;

insert into public.loyalty_accounts (id, organization_id, customer_id, program_id, current_stamps)
select ('d0d0d0d0-0000-0000-0000-00000000000' || n)::uuid,
       'a0a0a0a0-0000-0000-0000-000000000001',
       ('c0c0c0c0-0000-0000-0000-00000000000' || n)::uuid,
       'b0b0b0b0-0000-0000-0000-000000000001', 2
  from generate_series(1, 2) n;

insert into public.customer_cards (organization_id, customer_id, account_id)
select 'a0a0a0a0-0000-0000-0000-000000000001',
       ('c0c0c0c0-0000-0000-0000-00000000000' || n)::uuid,
       ('d0d0d0d0-0000-0000-0000-00000000000' || n)::uuid
  from generate_series(1, 2) n;

insert into public.push_subscriptions (organization_id, customer_id, endpoint, p256dh, auth)
select 'a0a0a0a0-0000-0000-0000-000000000001',
       ('c0c0c0c0-0000-0000-0000-00000000000' || n)::uuid,
       'https://push.example/' || n, 'k', 'a'
  from generate_series(1, 2) n;

insert into public.email_outbox (organization_id, customer_id, kind, to_email, idempotency_key)
select 'a0a0a0a0-0000-0000-0000-000000000001',
       ('c0c0c0c0-0000-0000-0000-00000000000' || n)::uuid,
       'welcome_card', 'cli' || n || '@example.test', 'e2e-outbox-' || n
  from generate_series(1, 2) n;

-- Movimiento de ledger del cliente 1, hecho por el staff a3 (para A11 y para
-- comprobar que la supresión NO toca el ledger).
insert into public.loyalty_transactions
  (id, organization_id, account_id, transaction_type, stamps_delta, performed_by, idempotency_key)
values ('e0e0e0e0-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001',
        'd0d0d0d0-0000-0000-0000-000000000001', 'earn', 2,
        '00000000-0000-0000-0000-0000000000d3', 'e2e-ledger-1');

insert into public.data_rights_requests (id, organization_id, customer_id, request_type, detail) values
  ('f1f1f1f1-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001',
   'c0c0c0c0-0000-0000-0000-000000000001', 'access',  'dame mis datos'),
  ('f1f1f1f1-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001',
   'c0c0c0c0-0000-0000-0000-000000000001', 'erasure', 'borren todo de Cliente1'),
  ('f1f1f1f1-0000-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000001',
   'c0c0c0c0-0000-0000-0000-000000000002', 'revocation', 'retiro mi autorización');

-- ---------- R01-R05 · transiciones y permisos --------------------------------

do $$
declare
  r json;
begin
  -- staff no gestiona derechos
  perform set_config('app.user_id', '00000000-0000-0000-0000-0000000000d3', false);
  perform pg_temp.t_err(
    $q$select public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000001', 'in_progress')$q$,
    'forbidden', 'R01 staff no gestiona solicitudes');

  -- manager: open → in_progress → resolved (con respuesta)
  perform set_config('app.user_id', '00000000-0000-0000-0000-0000000000d2', false);
  r := public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000001', 'in_progress');
  perform pg_temp.t_ok((r->>'ok')::boolean, 'R02a open → in_progress');
  perform pg_temp.t_err(
    $q$select public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000001', 'in_progress')$q$,
    'invalid_transition', 'R02b in_progress → in_progress no vale');
  perform pg_temp.t_err(
    $q$select public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000001', 'resolved')$q$,
    'response_required', 'R03a cerrar exige respuesta');
  perform pg_temp.t_err(
    $q$select public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000001', 'resolved', 'corto')$q$,
    'response_required', 'R03b respuesta demasiado corta');
  r := public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000001', 'resolved',
                                     'Te enviamos tus datos por correo.');
  perform pg_temp.t_ok((r->>'ok')::boolean and r->>'notify_email' = 'cli1@example.test',
                       'R04a in_progress → resolved y devuelve el correo a avisar');
  perform pg_temp.t_ok(
    (select resolved_at is not null and response like 'Te enviamos%'
       from public.data_rights_requests where id = 'f1f1f1f1-0000-0000-0000-000000000001'),
    'R04b resolved_at y respuesta guardados');
  perform pg_temp.t_err(
    $q$select public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000001', 'rejected', 'ya cerrada no se reabre')$q$,
    'invalid_transition', 'R05 una solicitud cerrada no se reabre');

  -- supresión/revocación solo owner/admin
  perform pg_temp.t_err(
    $q$select public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000002', 'resolved', 'eliminado según solicitud')$q$,
    'forbidden_destructive', 'R06 manager no ejecuta supresión');
  -- pero sí puede rechazar (no destructivo)
  r := public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000002', 'in_progress');
  perform pg_temp.t_ok((r->>'ok')::boolean, 'R06b manager sí puede dejarla en trámite');
end $$;

-- ---------- R07-R10 · supresión efectiva -------------------------------------

do $$
declare
  r json;
  n int;
begin
  perform set_config('app.user_id', '00000000-0000-0000-0000-0000000000d1', false);
  r := public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000002', 'resolved',
                                     'Datos eliminados conforme a tu solicitud.');
  perform pg_temp.t_ok(r->>'notify_email' = 'cli1@example.test',
                       'R07a se devuelve el correo ANTES de anonimizar');

  perform pg_temp.t_ok(
    (select email is null and phone is null and birth_date is null and last_name is null
            and first_name = 'Titular eliminado' and status = 'inactive'
       from public.customers where id = 'c0c0c0c0-0000-0000-0000-000000000001'),
    'R07b cliente anonimizado (sin PII)');
  perform pg_temp.t_ok(
    (select status = 'revoked' from public.customer_cards
      where customer_id = 'c0c0c0c0-0000-0000-0000-000000000001'),
    'R08a tarjetas revocadas');
  select count(*) into n from public.push_subscriptions
   where customer_id = 'c0c0c0c0-0000-0000-0000-000000000001';
  perform pg_temp.t_ok(n = 0, 'R08b suscripciones push eliminadas');
  select count(*) into n from public.email_outbox
   where customer_id = 'c0c0c0c0-0000-0000-0000-000000000001';
  perform pg_temp.t_ok(n = 0, 'R08c correos en cola eliminados');
  select count(*) into n from public.customer_consents
   where customer_id = 'c0c0c0c0-0000-0000-0000-000000000001' and status = 'withdrawn';
  perform pg_temp.t_ok(n = 4, 'R08d consentimientos retirados (evidencia, 4 finalidades)');
  perform pg_temp.t_ok(
    (select bool_and(detail is null) from public.data_rights_requests
      where customer_id = 'c0c0c0c0-0000-0000-0000-000000000001'),
    'R08e el texto libre de sus solicitudes se borra');
  perform pg_temp.t_ok(
    (select stamps_delta = 2 and performed_by = '00000000-0000-0000-0000-0000000000d3'
       from public.loyalty_transactions where id = 'e0e0e0e0-0000-0000-0000-000000000001'),
    'R09 el ledger NO se toca con la supresión');

  -- revocación: conserva datos, retira permisos y cierra la tarjeta
  r := public.resolve_rights_request('f1f1f1f1-0000-0000-0000-000000000003', 'resolved',
                                     'Autorización retirada, tarjeta cerrada.');
  perform pg_temp.t_ok(
    (select email = 'cli2@example.test' and status = 'inactive' and marketing_consent_at is null
       from public.customers where id = 'c0c0c0c0-0000-0000-0000-000000000002'),
    'R10a revocación: conserva datos pero inactiva y sin marketing');
  perform pg_temp.t_ok(
    (select status = 'revoked' from public.customer_cards
      where customer_id = 'c0c0c0c0-0000-0000-0000-000000000002'),
    'R10b revocación: tarjeta cerrada');
end $$;

-- ---------- R11 · UPDATE directo a derechos denegado -------------------------

grant authenticated to current_user;
set role authenticated;
select set_config('app.user_id', '00000000-0000-0000-0000-0000000000d1', false);
do $$
begin
  perform pg_temp.t_err(
    $q$update public.data_rights_requests set status = 'resolved'
        where id = 'f1f1f1f1-0000-0000-0000-000000000001'$q$,
    'permission denied', 'R11 sin UPDATE directo: solo por la RPC');
end $$;
reset role;

-- ---------- P01-P04 · canal de privacidad obligatorio (QA-A8) ----------------

do $$
declare
  v_join_r text;
  v_join_s text;
  r        json;
begin
  select join_token into v_join_r from public.organizations where id = 'a0a0a0a0-0000-0000-0000-000000000001';
  select join_token into v_join_s from public.organizations where id = 'a0a0a0a0-0000-0000-0000-000000000002';

  r := public.resolve_join(v_join_s);
  perform pg_temp.t_ok(r->>'reason' = 'no_privacy_channel', 'P01 sin correo de privacidad: resolve_join lo marca');
  r := public.register_customer_via_join(v_join_s, 'Ana', 'ana@example.test', null, false, 'h-s', 'p-s');
  perform pg_temp.t_ok(r->>'error' = 'join_disabled', 'P02 y el registro por QR se rechaza');

  r := public.resolve_join(v_join_r);
  perform pg_temp.t_ok((r->>'ok')::boolean, 'P03 con correo de privacidad el QR funciona');
  r := public.register_customer_via_join(v_join_r, 'Beto', 'beto@example.test', null, false, 'h-r', 'p-r');
  perform pg_temp.t_ok((r->>'ok')::boolean, 'P04 registro por QR ok con canal de privacidad');

  -- espacios en blanco no cuentan como canal
  update public.organizations set legal = '{"privacy_email":"   "}'
   where id = 'a0a0a0a0-0000-0000-0000-000000000001';
  r := public.resolve_join(v_join_r);
  perform pg_temp.t_ok(r->>'reason' = 'no_privacy_channel', 'P05 correo en blanco = sin canal');
  update public.organizations set legal = '{"privacy_email":"privacidad@org-r.test"}'
   where id = 'a0a0a0a0-0000-0000-0000-000000000001';
end $$;

-- ---------- L01-L04 · baja de usuarios con ledger (QA-A11) -------------------
-- Sin sesión de usuario (como service_role / panel de Supabase): auth.uid() nulo.
select set_config('app.user_id', '', false);

do $$
declare
  n int;
begin
  -- a3 (staff) hizo un movimiento de ledger: antes de 0019 no se podía borrar.
  delete from auth.users where id = '00000000-0000-0000-0000-0000000000d3';
  select count(*) into n from auth.users where id = '00000000-0000-0000-0000-0000000000d3';
  perform pg_temp.t_ok(n = 0, 'L01 se puede borrar un usuario que operó el ledger');

  perform pg_temp.t_ok(
    (select performed_by is null and stamps_delta = 2
       from public.loyalty_transactions where id = 'e0e0e0e0-0000-0000-0000-000000000001'),
    'L02 el movimiento se conserva, solo pierde el vínculo al usuario');

  perform pg_temp.t_err(
    $q$update public.loyalty_transactions set stamps_delta = 99
        where id = 'e0e0e0e0-0000-0000-0000-000000000001'$q$,
    'append-only', 'L03a el ledger sigue inmutable (importes)');
  perform pg_temp.t_err(
    $q$update public.loyalty_transactions set performed_by = '00000000-0000-0000-0000-0000000000d1'
        where id = 'e0e0e0e0-0000-0000-0000-000000000001'$q$,
    'append-only', 'L03b no se puede reasignar a otro usuario');
  perform pg_temp.t_err(
    $q$delete from public.loyalty_transactions
        where id = 'e0e0e0e0-0000-0000-0000-000000000001'$q$,
    'append-only', 'L03c ni borrar movimientos');

  -- el único owner de una org no se puede dar de baja sin traspaso (QA-C3)
  perform pg_temp.t_err(
    $q$delete from auth.users where id = '00000000-0000-0000-0000-0000000000d5'$q$,
    'last_owner', 'L04 un único owner no se borra sin traspasar');
end $$;

do $$ begin raise notice '===== E2E RIGHTS/PRIVACY: TODOS LOS TESTS PASARON ====='; end $$;
