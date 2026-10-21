-- ============================================================================
-- E2E del motor de fidelización — corre sobre Postgres de descarte (CI job
-- `sql`) o una rama temporal de Neon. NUNCA contra producción.
--
-- Requisito previo (igual que el job sql de CI): stub de auth —
--   create schema auth; create table auth.users(id uuid primary key);
--   create role anon; create role authenticated;
--   create function auth.uid() ... current_setting('app.user_id')
--
-- auth.uid() se simula con: select set_config('app.user_id', '<uuid>', false)
-- ============================================================================

-- ---------- helpers de aserción (pg_temp: mueren con la sesión) -------------

create or replace function pg_temp.t_ok(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if not p_cond then
    raise exception 'E2E_FAIL: %', p_label;
  end if;
  raise notice 'ok - %', p_label;
end $$;

-- Ejecuta SQL esperando un error cuyo mensaje contenga p_pattern.
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

-- ---------- fixtures: 2 orgs, 3 usuarios, programas sellos+puntos -----------

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'),  -- staff  org A
  ('00000000-0000-0000-0000-0000000000a2'),  -- manager org A (revocar/reversos)
  ('00000000-0000-0000-0000-0000000000b1');  -- staff  org B (cross-org)

insert into public.organizations (id, name, slug, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Org A E2E', 'e2e-org-a', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Org B E2E', 'e2e-org-b', 'active');

insert into public.organization_members (organization_id, user_id, role, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'staff',   'active'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'manager', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b1', 'staff',   'active');

insert into public.customers (id, organization_id, first_name) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Cliente Sellos'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Cliente Puntos'),
  ('cccccccc-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Cliente B');

insert into public.loyalty_programs
  (id, organization_id, name, program_type, status, stamp_goal, points_per_currency_unit) values
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Sellos E2E', 'stamps', 'active', 8,   null),
  ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Puntos E2E', 'points', 'active', null, 1),
  ('dddddddd-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Sellos B',   'stamps', 'active', 10,  null);

insert into public.rewards (id, organization_id, program_id, name, cost_stamps, cost_points, status) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'Premio 4 sellos',   4,   null, 'active'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002', 'Premio 50 puntos',  null, 50,   'active');

-- ---------- batería principal (corre como superuser: las RPCs son ----------
-- ---------- security definer y autorizan por app.user_id)         ----------

do $e2e$
declare
  U_STAFF   constant uuid := '00000000-0000-0000-0000-0000000000a1';
  U_MANAGER constant uuid := '00000000-0000-0000-0000-0000000000a2';
  U_STAFF_B constant uuid := '00000000-0000-0000-0000-0000000000b1';
  ORG_A     constant uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  CUST_S    constant uuid := 'cccccccc-0000-0000-0000-000000000001';
  CUST_P    constant uuid := 'cccccccc-0000-0000-0000-000000000002';
  PROG_S    constant uuid := 'dddddddd-0000-0000-0000-000000000001';
  PROG_P    constant uuid := 'dddddddd-0000-0000-0000-000000000002';
  PROG_B    constant uuid := 'dddddddd-0000-0000-0000-0000000000b1';
  CUST_B    constant uuid := 'cccccccc-0000-0000-0000-0000000000b1';
  REW_S     constant uuid := 'eeeeeeee-0000-0000-0000-000000000001';

  v_card_s uuid; v_card_p uuid;
  v_token_s text; v_token_p text;
  v_acc_s uuid; v_acc_p uuid;
  r json;
  v1 uuid; v2 uuid;
  n int; nb bigint;
  n_bool boolean; v_consent_ts timestamptz;
begin
  perform set_config('app.user_id', U_STAFF::text, false);

  -- --- T00 emisión por RPC real + idempotencia de issue_card ---
  v_card_s := public.issue_card(CUST_S, PROG_S);
  perform pg_temp.t_ok(public.issue_card(CUST_S, PROG_S) = v_card_s,
                       'T00 issue_card es idempotente (misma tarjeta)');
  v_card_p := public.issue_card(CUST_P, PROG_P);
  select token, account_id into v_token_s, v_acc_s
    from public.customer_cards where id = v_card_s;
  select token, account_id into v_token_p, v_acc_p
    from public.customer_cards where id = v_card_p;

  -- --- T01 visita con sellos vía escaneo ---
  r := public.scan_card(v_token_s, 1, null, 'e2e-scan-1');
  perform pg_temp.t_ok((r->>'current_stamps')::int = 1,
                       'T01 scan_card suma 1 sello y devuelve proyección');

  -- --- T02 misma clave de idempotencia: sin duplicar ---
  r := public.scan_card(v_token_s, 1, null, 'e2e-scan-1');
  select count(*) into n from public.customer_visits
   where organization_id = ORG_A and idempotency_key = 'e2e-scan-1';
  perform pg_temp.t_ok((r->>'current_stamps')::int = 1 and n = 1,
                       'T02 replay mismo key: 1 visita, saldo intacto');
  select count(*) into n from public.loyalty_transactions
   where organization_id = ORG_A and idempotency_key = 'e2e-scan-1';
  perform pg_temp.t_ok(n = 1, 'T02b una sola tx en el ledger');

  -- --- T03 visita con puntos + idempotencia de earn ---
  v1 := public.earn(v_acc_p, 120, 0, null, null, 'e2e-earn-p1', 'compra');
  v2 := public.earn(v_acc_p, 120, 0, null, null, 'e2e-earn-p1', 'compra');
  select current_points into nb from public.loyalty_accounts where id = v_acc_p;
  perform pg_temp.t_ok(v1 = v2 and nb = 120,
                       'T03 earn puntos + replay idempotente (misma tx)');

  v1 := public.record_visit(CUST_P, null, 150000, 'manual', 'e2e-visit-1');
  v2 := public.record_visit(CUST_P, null, 150000, 'manual', 'e2e-visit-1');
  perform pg_temp.t_ok(v1 = v2, 'T04 record_visit idempotente');

  -- --- T05 canje sin saldo suficiente ---
  perform pg_temp.t_err(
    format('select public.redeem_reward(%L,%L,null,%L)', REW_S, CUST_S, 'e2e-rd-0'),
    'insufficient_balance', 'T05 canje sin saldo → insufficient_balance');

  -- --- T06 completar saldo y canjear (cobro exacto) ---
  r := public.scan_card(v_token_s, 3, null, 'e2e-scan-2');
  perform pg_temp.t_ok((r->>'current_stamps')::int = 4, 'T06a saldo llega a 4');
  v1 := public.redeem_reward(REW_S, CUST_S, null, 'e2e-rd-1');
  select current_stamps into n from public.loyalty_accounts where id = v_acc_s;
  perform pg_temp.t_ok(n = 0, 'T06b canje cobra exacto → saldo 0');

  -- --- T07 doble canje misma clave (equivale a reintento concurrente) ---
  v2 := public.redeem_reward(REW_S, CUST_S, null, 'e2e-rd-1');
  select count(*) into n from public.redemptions where organization_id = ORG_A;
  perform pg_temp.t_ok(v1 = v2 and n = 1,
                       'T07 doble canje misma clave = mismo canje, sin cobrar 2 veces');

  -- --- T08 saldo nunca negativo ---
  perform pg_temp.t_err(
    format('select public.redeem_reward(%L,%L,null,%L)', REW_S, CUST_S, 'e2e-rd-2'),
    'insufficient_balance', 'T08 segundo canje con otra clave rechazado');

  -- --- T09 cross-org por RPC ---
  perform set_config('app.user_id', U_STAFF_B::text, false);
  perform pg_temp.t_err(
    format('select public.scan_card(%L, 1, null, %L)', v_token_s, 'e2e-xorg'),
    'forbidden', 'T09a staff org B no escanea tarjeta de org A');
  perform pg_temp.t_err(
    format('select public.earn(%L, 10, 0, null, null, %L)', v_acc_p, 'e2e-xorg-e'),
    'forbidden', 'T09b staff org B no suma puntos en org A');
  perform set_config('app.user_id', U_MANAGER::text, false);

  -- --- T10 tarjeta revocada ---
  perform public.revoke_card(v_card_s);
  perform pg_temp.t_err(
    format('select public.scan_card(%L, 1, null, %L)', v_token_s, 'e2e-scan-rev'),
    'card_revoked', 'T10 tarjeta revocada rechaza escaneo');
  r := public.get_card_public(v_token_s);
  perform pg_temp.t_ok(r->>'card_status' = 'revoked',
                       'T10b proyección pública refleja la revocación');

  -- --- T11 token inválido ---
  perform pg_temp.t_err(
    'select public.scan_card(''token-inexistente-e2e'', 1, null, ''e2e-bad'')',
    'card_not_found', 'T11 token inválido → card_not_found');

  -- --- T11c scan_card en programa de PUNTOS (sub-bloque con rollback para
  --     no alterar los saldos que afirman los tests siguientes) ---
  begin
    r := public.scan_card(v_token_p, 1, null, 'e2e-scan-pts', 25.5);
    perform pg_temp.t_ok(
      r->>'program_type' = 'points' and (r->>'points_earned')::int = 25
        and (r->>'current_points')::int = 145,
      'T11c scan puntos: floor(25.5 x 1) = 25 pts, saldo 120 -> 145');
    select amount_minor into nb from public.loyalty_transactions
     where organization_id = ORG_A and idempotency_key = 'e2e-scan-pts';
    perform pg_temp.t_ok(nb = 2550, 'T11d monto guardado en unidades menores');
    perform pg_temp.t_err(
      format('select public.scan_card(%L, 1, null, %L)', v_token_p, 'e2e-scan-pts2'),
      'amount_required', 'T11e programa por puntos exige monto');
    raise exception 'E2E_ROLLBACK';
  exception when others then
    if sqlerrm <> 'E2E_ROLLBACK' then raise; end if;
  end;

  -- --- T12 rate limit (60 escaneos/min por empleado) ---
  insert into public.customer_visits (organization_id, customer_id, performed_by, source)
  select ORG_A, CUST_S, U_STAFF, 'manual' from generate_series(1, 60);
  perform set_config('app.user_id', U_STAFF::text, false);
  perform pg_temp.t_err(
    format('select public.scan_card(%L, 1, null, %L, 10)', v_token_p, 'e2e-scan-rl'),
    'rate_limited', 'T12 rate limit bloquea el escaneo 61');
  select current_points into nb from public.loyalty_accounts where id = v_acc_p;
  perform pg_temp.t_ok(nb = 120, 'T12b el rechazo por rate limit no mutó saldo');

  -- --- T13 ledger append-only ---
  perform pg_temp.t_err(
    'update public.loyalty_transactions set points_delta = 999',
    'append-only', 'T13a UPDATE al ledger prohibido');
  perform pg_temp.t_err(
    'delete from public.loyalty_transactions',
    'append-only', 'T13b DELETE al ledger prohibido');

  -- --- T14 reversos compensatorios ---
  perform pg_temp.t_err(
    format('select public.reverse_transaction(%L, %L)', v1, 'x'),
    'transaction_not_found', 'T14a tx inexistente → error limpio');
  select id into v1 from public.loyalty_transactions
   where organization_id = ORG_A and idempotency_key = 'e2e-earn-p1';
  -- staff no puede revertir (requiere manager+)
  perform pg_temp.t_err(
    format('select public.reverse_transaction(%L, %L)', v1, 'staff intenta'),
    'forbidden', 'T14b staff no puede revertir');
  perform set_config('app.user_id', U_MANAGER::text, false);
  v2 := public.reverse_transaction(v1, 'corrección e2e');
  select current_points into nb from public.loyalty_accounts where id = v_acc_p;
  perform pg_temp.t_ok(nb = 0, 'T14c reverso compensa el saldo (120 → 0)');
  perform pg_temp.t_ok(v2 is not null and v2 <> v1,
                       'T14d el reverso es movimiento nuevo (no edita el original)');
  perform pg_temp.t_err(
    format('select public.reverse_transaction(%L, %L)', v1, 'again'),
    'already_reversed', 'T14e doble reverso bloqueado');

  -- --- T15 proyección pública acotada ---
  r := public.get_card_app_data(v_token_p);
  perform pg_temp.t_ok(r is not null and r->>'org_name' = 'Org A E2E'
                       and r->>'program_type' = 'points'
                       and json_typeof(r->'rewards') = 'array',
                       'T15 get_card_app_data devuelve la proyección');
  insert into public.redemptions (organization_id, customer_id, reward_id, account_id, status)
  select ORG_A, CUST_P, 'eeeeeeee-0000-0000-0000-000000000002', v_acc_p, 'completed'
    from generate_series(1, 15);
  r := public.get_card_app_data(v_token_p);
  perform pg_temp.t_ok(json_array_length(r->'redemptions') = 10,
                       'T15b redemptions acotado a los 10 más recientes');
  perform pg_temp.t_ok(public.get_card_app_data('token-falso') is null,
                       'T15c token inexistente → null');

  -- --- T16 permisos de ejecución ---
  perform pg_temp.t_ok(
    not has_function_privilege('anon', 'public.scan_card(text,int,uuid,text)', 'execute')
    and not has_function_privilege('anon', 'public.earn(uuid,bigint,int,bigint,uuid,text,text)', 'execute')
    and not has_function_privilege('anon', 'public.redeem_reward(uuid,uuid,uuid,text)', 'execute'),
    'T16a anon no ejecuta RPCs del motor');
  perform pg_temp.t_ok(
    has_function_privilege('anon', 'public.get_card_public(text)', 'execute')
    and has_function_privilege('anon', 'public.get_card_app_data(text)', 'execute')
    and has_function_privilege('anon', 'public.record_card_consent(text,boolean)', 'execute'),
    'T16b proyecciones públicas y consentimiento ejecutables por anon');

  -- --- T17 earn requiere delta positivo ---
  perform pg_temp.t_err(
    format('select public.earn(%L, 0, 0, null, null, %L)', v_acc_p, 'e2e-neg'),
    'delta positivo', 'T17 earn sin delta positivo rechazado');

  -- --- T18 consentimiento desde la tarjeta pública ---
  r := public.get_card_app_data(v_token_p);
  perform pg_temp.t_ok((r->>'consent_pending')::boolean,
                       'T18a cliente nuevo → consent_pending = true');
  perform pg_temp.t_ok(public.record_card_consent('token-inexistente-e2e', true) = false,
                       'T18b token inválido → false, sin escritura');
  perform pg_temp.t_ok(public.record_card_consent(v_token_p, true),
                       'T18c consentimiento registrado (datos + marketing)');
  select cu.data_consent_at is not null and cu.marketing_consent_at is not null,
         cu.data_consent_at
    into strict n_bool, v_consent_ts
    from public.customers cu where cu.id = CUST_P;
  perform pg_temp.t_ok(n_bool, 'T18d ambos timestamps escritos');
  r := public.get_card_app_data(v_token_p);
  perform pg_temp.t_ok((r->>'consent_pending')::boolean = false,
                       'T18e tras consentir, el formulario no vuelve a salir');
  -- Idempotencia: una segunda llamada no mueve el timestamp original.
  perform public.record_card_consent(v_token_p, false);
  perform pg_temp.t_ok(
    (select cu.data_consent_at = v_consent_ts from public.customers cu where cu.id = CUST_P),
    'T18f segunda llamada no pisa el timestamp (coalesce)');
end $e2e$;

-- ---------- T09c/d · RLS a nivel tabla (necesita role no-superuser) ----------

-- En CI corre como postgres (superuser → SET ROLE libre); en Neon la conexión
-- es neondb_owner, que necesita membresía del rol para hacer SET ROLE.
grant authenticated to current_user;

set role authenticated;
select set_config('app.user_id', '00000000-0000-0000-0000-0000000000b1', false);  -- staff B
do $$
declare n int;
begin
  select count(*) into n from public.customers
   where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001';
  perform pg_temp.t_ok(n = 0, 'T09c RLS: staff B lee 0 clientes de org A');
end $$;

select set_config('app.user_id', '00000000-0000-0000-0000-0000000000a1', false);  -- staff A
do $$
declare n int;
begin
  select count(*) into n from public.customers
   where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001';
  perform pg_temp.t_ok(n = 2, 'T09d RLS: staff A sí ve sus 2 clientes');
end $$;
reset role;

do $$ begin raise notice '===== E2E LOYALTY: TODOS LOS TESTS PASARON ====='; end $$;
