-- ============================================================================
-- E2E: rate limit genérico (check_rate_limit) y eliminación segura de programas
-- (program_delete_summary / delete_program). Autónomo: trae sus fixtures.
-- ============================================================================

create or replace function pg_temp.t_ok(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if not p_cond then raise exception 'E2E_FAIL: %', p_label; end if;
  raise notice 'ok - %', p_label;
end $$;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000a0e1'),  -- owner  org P
  ('00000000-0000-0000-0000-00000000a0e2'),  -- staff  org P
  ('00000000-0000-0000-0000-00000000a0e9');  -- owner  org Q (otro comercio)

insert into public.organizations (id, name, slug, status, features, legal) values
  ('ffffffff-1111-0000-0000-00000000000a', 'Org P Prog', 'e2e-org-p', 'active', '{}', '{}'),
  ('ffffffff-1111-0000-0000-00000000000b', 'Org Q Prog', 'e2e-org-q', 'active', '{}', '{}');

insert into public.organization_members (organization_id, user_id, role, status) values
  ('ffffffff-1111-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a0e1', 'owner', 'active'),
  ('ffffffff-1111-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a0e2', 'staff', 'active'),
  ('ffffffff-1111-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000a0e9', 'owner', 'active');

insert into public.loyalty_programs (id, organization_id, name, program_type, status, stamp_goal) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'ffffffff-1111-0000-0000-00000000000a', 'Activo P', 'stamps', 'active', 8),
  ('aaaaaaaa-2222-0000-0000-000000000002', 'ffffffff-1111-0000-0000-00000000000a', 'Archivado vacío', 'stamps', 'archived', 8),
  ('aaaaaaaa-2222-0000-0000-000000000003', 'ffffffff-1111-0000-0000-00000000000a', 'Archivado con historial', 'points', 'archived', null),
  ('aaaaaaaa-2222-0000-0000-000000000004', 'ffffffff-1111-0000-0000-00000000000b', 'Archivado de Q', 'stamps', 'archived', 8);

insert into public.customers (id, organization_id, first_name, email) values
  ('cccccccc-2222-0000-0000-000000000001', 'ffffffff-1111-0000-0000-00000000000a', 'Cli P', 'p@e2e.test');

insert into public.loyalty_accounts (id, organization_id, customer_id, program_id) values
  ('bbbbbbbb-2222-0000-0000-000000000002', 'ffffffff-1111-0000-0000-00000000000a', 'cccccccc-2222-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000002'),
  ('bbbbbbbb-2222-0000-0000-000000000003', 'ffffffff-1111-0000-0000-00000000000a', 'cccccccc-2222-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000003');

insert into public.customer_cards (organization_id, customer_id, account_id) values
  ('ffffffff-1111-0000-0000-00000000000a', 'cccccccc-2222-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000002'),
  ('ffffffff-1111-0000-0000-00000000000a', 'cccccccc-2222-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000003');

insert into public.rewards (organization_id, program_id, name, cost_stamps) values
  ('ffffffff-1111-0000-0000-00000000000a', 'aaaaaaaa-2222-0000-0000-000000000002', 'Premio vacío', 5);

insert into public.loyalty_transactions (organization_id, account_id, transaction_type, points_delta) values
  ('ffffffff-1111-0000-0000-00000000000a', 'bbbbbbbb-2222-0000-0000-000000000003', 'earn', 50);

do $e2e$
declare
  U_OWNER_P constant uuid := '00000000-0000-0000-0000-00000000a0e1';
  U_STAFF_P constant uuid := '00000000-0000-0000-0000-00000000a0e2';
  U_OWNER_Q constant uuid := '00000000-0000-0000-0000-00000000a0e9';
  P_ACTIVE  constant uuid := 'aaaaaaaa-2222-0000-0000-000000000001';
  P_EMPTY   constant uuid := 'aaaaaaaa-2222-0000-0000-000000000002';
  P_HIST    constant uuid := 'aaaaaaaa-2222-0000-0000-000000000003';
  P_OTHER   constant uuid := 'aaaaaaaa-2222-0000-0000-000000000004';
  r json;
  n int;
  b boolean;
begin
  -- ---- R: rate limit -------------------------------------------------------
  b := public.check_rate_limit('e2e:k1', 3, 3600);
  b := b and public.check_rate_limit('e2e:k1', 3, 3600);
  b := b and public.check_rate_limit('e2e:k1', 3, 3600);
  perform pg_temp.t_ok(b, 'R1 las 3 primeras llamadas pasan');
  perform pg_temp.t_ok(public.check_rate_limit('e2e:k1', 3, 3600) = false, 'R2 la 4.ª se bloquea');
  perform pg_temp.t_ok(public.check_rate_limit('e2e:k2', 3, 3600), 'R3 otra clave tiene su propio contador');
  perform pg_temp.t_ok(public.check_rate_limit(null, 3, 60), 'R4 clave nula no bloquea');
  perform pg_temp.t_ok(public.check_rate_limit('e2e:k3', 0, 60), 'R5 límite inválido no bloquea');
  select hits into n from public.rate_limits where key = 'e2e:k1';
  perform pg_temp.t_ok(n = 4, 'R6 el contador cuenta también los intentos bloqueados');
  perform pg_temp.t_ok(not has_function_privilege('anon', 'public.check_rate_limit(text,int,int)', 'execute'),
                       'R7 anon no puede ejecutar check_rate_limit');
  perform pg_temp.t_ok(not has_function_privilege('authenticated', 'public.check_rate_limit(text,int,int)', 'execute'),
                       'R8 authenticated no puede ejecutar check_rate_limit');

  -- ---- D: eliminar programas -----------------------------------------------
  perform set_config('app.user_id', U_OWNER_P::text, false);
  r := public.program_delete_summary(P_EMPTY);
  perform pg_temp.t_ok((r->>'ok')::boolean and (r->>'can_delete')::boolean
                       and (r->>'accounts')::int = 1 and (r->>'cards')::int = 1
                       and (r->>'rewards')::int = 1,
                       'D1 resumen de un archivado sin historial: se puede borrar y cuenta lo que arrastra');

  r := public.program_delete_summary(P_HIST);
  perform pg_temp.t_ok((r->>'can_delete')::boolean = false and r->>'reason' = 'has_history'
                       and (r->>'transactions')::int = 1,
                       'D2 con historial: no se puede, motivo has_history');

  r := public.program_delete_summary(P_ACTIVE);
  perform pg_temp.t_ok((r->>'can_delete')::boolean = false and r->>'reason' = 'not_archived',
                       'D3 programa activo: hay que archivarlo antes');

  r := public.delete_program(P_ACTIVE);
  perform pg_temp.t_ok((r->>'ok')::boolean = false and r->>'error' = 'not_archived'
                       and exists (select 1 from public.loyalty_programs where id = P_ACTIVE),
                       'D4 delete_program rechaza un activo y no lo borra');
  r := public.delete_program(P_HIST);
  perform pg_temp.t_ok((r->>'ok')::boolean = false and r->>'error' = 'has_history'
                       and exists (select 1 from public.loyalty_programs where id = P_HIST)
                       and exists (select 1 from public.loyalty_transactions
                                    where account_id = 'bbbbbbbb-2222-0000-0000-000000000003'),
                       'D5 delete_program rechaza con historial y el ledger queda intacto');

  perform set_config('app.user_id', U_STAFF_P::text, false);
  r := public.delete_program(P_EMPTY);
  perform pg_temp.t_ok((r->>'ok')::boolean = false and r->>'error' = 'forbidden'
                       and exists (select 1 from public.loyalty_programs where id = P_EMPTY),
                       'D6 staff no puede eliminar');

  perform set_config('app.user_id', U_OWNER_Q::text, false);
  r := public.delete_program(P_EMPTY);
  perform pg_temp.t_ok((r->>'ok')::boolean = false and r->>'error' = 'forbidden',
                       'D7 owner de OTRO comercio no puede eliminar');
  r := public.delete_program(P_OTHER);
  perform pg_temp.t_ok((r->>'ok')::boolean, 'D8 owner elimina su propio archivado vacío');

  perform set_config('app.user_id', U_OWNER_P::text, false);
  r := public.delete_program(P_EMPTY);
  perform pg_temp.t_ok((r->>'ok')::boolean and (r->>'accounts')::int = 1,
                       'D9 owner elimina el archivado sin historial');
  select count(*) into n from public.loyalty_accounts where program_id = P_EMPTY;
  perform pg_temp.t_ok(n = 0, 'D10 cuentas del programa eliminadas');
  select count(*) into n from public.rewards where program_id = P_EMPTY;
  perform pg_temp.t_ok(n = 0, 'D11 premios del programa eliminados');
  select count(*) into n from public.customer_cards c
    where c.account_id = 'bbbbbbbb-2222-0000-0000-000000000002';
  perform pg_temp.t_ok(n = 0, 'D12 tarjetas del programa eliminadas');
  perform pg_temp.t_ok(exists (select 1 from public.customers where id = 'cccccccc-2222-0000-0000-000000000001'),
                       'D13 el cliente sigue en el CRM');
  r := public.program_delete_summary(P_EMPTY);
  perform pg_temp.t_ok(r->>'error' = 'program_not_found', 'D14 un programa ya eliminado no existe');
end
$e2e$;
