-- ============================================================================
-- E2E ciclo de vida de organizaciones (QA-P2) y columnas privilegiadas.
-- Autónomo. Requisito previo: stub de auth.
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

-- ---------- fixtures: org L (con historial) y org E (vacía) -------------------

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000e1'),  -- owner L
  ('00000000-0000-0000-0000-0000000000e2'),  -- admin L
  ('00000000-0000-0000-0000-0000000000e3');  -- owner E

insert into public.organizations (id, name, slug, status, legal) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'Org L Historial', 'e2e-org-l', 'active',
   '{"privacy_email":"p@l.test"}'),
  ('a1a1a1a1-0000-0000-0000-000000000002', 'Org E Vacia', 'e2e-org-e', 'active', '{}');

insert into public.organization_members (organization_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', 'owner'),
  ('a1a1a1a1-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e2', 'admin'),
  ('a1a1a1a1-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e3', 'owner');

insert into public.loyalty_programs (id, organization_id, name, program_type, stamp_goal) values
  ('b1b1b1b1-0000-0000-0000-000000000001', 'a1a1a1a1-0000-0000-0000-000000000001', 'Sellos L', 'stamps', 5);
insert into public.customers (id, organization_id, first_name, email) values
  ('c1c1c1c1-0000-0000-0000-000000000001', 'a1a1a1a1-0000-0000-0000-000000000001', 'Cli', 'cli@l.test');
insert into public.loyalty_accounts (id, organization_id, customer_id, program_id) values
  ('d1d1d1d1-0000-0000-0000-000000000001', 'a1a1a1a1-0000-0000-0000-000000000001',
   'c1c1c1c1-0000-0000-0000-000000000001', 'b1b1b1b1-0000-0000-0000-000000000001');
insert into public.customer_cards (organization_id, customer_id, account_id) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'c1c1c1c1-0000-0000-0000-000000000001',
   'd1d1d1d1-0000-0000-0000-000000000001');
insert into public.push_subscriptions (organization_id, customer_id, endpoint, p256dh, auth) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'c1c1c1c1-0000-0000-0000-000000000001',
   'https://push.example/l', 'k', 'a');
insert into public.push_campaigns (organization_id, title, body, status) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 't', 'b', 'draft');
insert into public.loyalty_transactions
  (organization_id, account_id, transaction_type, stamps_delta, idempotency_key) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'd1d1d1d1-0000-0000-0000-000000000001', 'earn', 1, 'e2e-l-1');

-- ---------- X01-X03 · columnas privilegiadas ----------------------------------

grant authenticated to current_user;
set role authenticated;
select set_config('app.user_id', '00000000-0000-0000-0000-0000000000e2', false);  -- admin L
do $$
begin
  update public.organizations set name = 'Org L Renombrada' where id = 'a1a1a1a1-0000-0000-0000-000000000001';
  perform pg_temp.t_ok(
    (select name = 'Org L Renombrada' from public.organizations where id = 'a1a1a1a1-0000-0000-0000-000000000001'),
    'X01 el admin sí edita las columnas de Configuración');
  perform pg_temp.t_err(
    $q$update public.organizations set status = 'trial' where id = 'a1a1a1a1-0000-0000-0000-000000000001'$q$,
    'permission denied', 'X02 el admin NO cambia el status del plan');
  perform pg_temp.t_err(
    $q$update public.organizations set limits = '{"push_campaigns_per_month":9999}' where id = 'a1a1a1a1-0000-0000-0000-000000000001'$q$,
    'permission denied', 'X03 el admin NO sube sus propios límites');
  perform pg_temp.t_err(
    $q$update public.organizations set slug = 'otro-slug' where id = 'a1a1a1a1-0000-0000-0000-000000000001'$q$,
    'permission denied', 'X03b ni cambia el slug');
end $$;

-- ---------- X04-X07 · cerrar --------------------------------------------------

do $$
begin
  perform pg_temp.t_err(
    $q$select public.close_organization('a1a1a1a1-0000-0000-0000-000000000001')$q$,
    'forbidden', 'X04 un admin no cierra la organización (solo owner)');
end $$;

select set_config('app.user_id', '00000000-0000-0000-0000-0000000000e1', false);  -- owner L
do $$
declare r json; n int;
begin
  r := public.close_organization('a1a1a1a1-0000-0000-0000-000000000001');
  perform pg_temp.t_ok((r->>'cards_revoked')::int = 1, 'X05a close_organization revoca las tarjetas');
  perform pg_temp.t_ok(
    (select status = 'closed' from public.organizations where id = 'a1a1a1a1-0000-0000-0000-000000000001'),
    'X05b status = closed');
  select count(*) into n from public.push_subscriptions where organization_id = 'a1a1a1a1-0000-0000-0000-000000000001';
  perform pg_temp.t_ok(n = 0, 'X05c suscripciones push eliminadas');
  perform pg_temp.t_ok(
    (select status = 'cancelled' from public.push_campaigns where organization_id = 'a1a1a1a1-0000-0000-0000-000000000001'),
    'X05d campañas pendientes canceladas');
  perform pg_temp.t_ok(
    (select count(*) = 1 from public.loyalty_transactions where organization_id = 'a1a1a1a1-0000-0000-0000-000000000001'),
    'X05e el ledger se conserva');
  perform pg_temp.t_err(
    $q$select public.close_organization('a1a1a1a1-0000-0000-0000-000000000001')$q$,
    'already_closed', 'X06 cerrar dos veces falla limpio');
  perform pg_temp.t_ok(
    public.resolve_join((select join_token from public.organizations where id = 'a1a1a1a1-0000-0000-0000-000000000001'))->>'reason' = 'unavailable',
    'X07 el QR de una org cerrada deja de funcionar');
end $$;

-- ---------- X08-X11 · eliminar ------------------------------------------------

do $$
begin
  perform pg_temp.t_err(
    $q$select public.delete_organization('a1a1a1a1-0000-0000-0000-000000000001', 'e2e-org-l')$q$,
    'has_history', 'X08 una org con movimientos NO se elimina (se cierra)');
end $$;

select set_config('app.user_id', '00000000-0000-0000-0000-0000000000e3', false);  -- owner E
do $$
begin
  perform pg_temp.t_err(
    $q$select public.delete_organization('a1a1a1a1-0000-0000-0000-000000000002', 'slug-equivocado')$q$,
    'slug_mismatch', 'X09 exige escribir el slug correcto');
  perform pg_temp.t_err(
    $q$select public.delete_organization('a1a1a1a1-0000-0000-0000-000000000001', 'e2e-org-l')$q$,
    'forbidden', 'X10 un owner de otra org no puede eliminar esta');
  perform public.delete_organization('a1a1a1a1-0000-0000-0000-000000000002', 'e2e-org-e');
  perform pg_temp.t_ok(
    not exists (select 1 from public.organizations where id = 'a1a1a1a1-0000-0000-0000-000000000002'),
    'X11 una org sin historial se elimina por completo');
end $$;

reset role;
do $$ begin raise notice '===== E2E ORG LIFECYCLE: TODOS LOS TESTS PASARON ====='; end $$;
