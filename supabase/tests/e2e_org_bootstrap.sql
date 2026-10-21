-- ============================================================================
-- E2E de alta de organizaciones y guardia de owners (QA-C1, QA-C2, QA-C3).
-- Autónomo: trae sus propios fixtures. Requisito previo: stub de auth
-- (auth.users, roles anon/authenticated, auth.uid() leyendo app.user_id).
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

-- ---------- fixtures: org F con owner, admin y staff; un extraño -------------

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000f1'),  -- owner org F
  ('00000000-0000-0000-0000-0000000000f2'),  -- admin org F
  ('00000000-0000-0000-0000-0000000000f3'),  -- staff org F
  ('00000000-0000-0000-0000-0000000000f4'),  -- usuario sin orgs (extraño)
  ('00000000-0000-0000-0000-0000000000f5');  -- usuario libre para invitar

insert into public.organizations (id, name, slug) values
  ('f0f0f0f0-0000-0000-0000-000000000001', 'Org F Owners', 'e2e-org-f');

insert into public.organization_members (organization_id, user_id, role) values
  ('f0f0f0f0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1', 'owner'),
  ('f0f0f0f0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f2', 'admin'),
  ('f0f0f0f0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f3', 'staff');

grant authenticated to current_user;
set role authenticated;

-- ---------- O01-O04 · create_organization (QA-C1) ----------------------------

select set_config('app.user_id', '00000000-0000-0000-0000-0000000000f4', false);
do $$
declare
  v_id uuid;
  n    int;
begin
  v_id := public.create_organization('Comercio Nuevo', 'e2e-nuevo', '{"color":"#112233"}');
  perform pg_temp.t_ok(v_id is not null, 'O01a create_organization devuelve el id');

  select count(*) into n from public.organizations where id = v_id;
  perform pg_temp.t_ok(n = 1, 'O01b el creador ve su org (SELECT tras insertar)');

  select count(*) into n from public.organization_members
   where organization_id = v_id
     and user_id = '00000000-0000-0000-0000-0000000000f4'
     and role = 'owner' and status = 'active';
  perform pg_temp.t_ok(n = 1, 'O01c el creador queda owner activo');

  perform pg_temp.t_err(
    $q$select public.create_organization('Otro', 'e2e-nuevo')$q$,
    'duplicate key', 'O03 slug repetido → 23505');

  perform pg_temp.t_err(
    $q$insert into public.organizations (name, slug) values ('Directo', 'e2e-directo')$q$,
    'permission denied', 'O04 INSERT directo en organizations denegado');

  perform pg_temp.t_err(
    $q$select public.create_organization('X', 'e2e-corto')$q$,
    'check constraint', 'O05 nombre de 1 carácter rechazado');
end $$;

select set_config('app.user_id', '', false);
do $$
begin
  perform pg_temp.t_err(
    $q$select public.create_organization('Anon', 'e2e-anon')$q$,
    'unauthenticated', 'O02 sin sesión no crea orgs');
end $$;

-- ---------- O06-O07 · members_insert (QA-C2) ---------------------------------

select set_config('app.user_id', '00000000-0000-0000-0000-0000000000f4', false);
do $$
begin
  perform pg_temp.t_err(
    $q$insert into public.organization_members (organization_id, user_id, role)
       values ('f0f0f0f0-0000-0000-0000-000000000001',
               '00000000-0000-0000-0000-0000000000f4', 'owner')$q$,
    'row-level security', 'O06 un extraño NO puede hacerse owner de una org ajena');
  perform pg_temp.t_err(
    $q$insert into public.organization_members (organization_id, user_id, role)
       values ('f0f0f0f0-0000-0000-0000-000000000001',
               '00000000-0000-0000-0000-0000000000f4', 'staff')$q$,
    'row-level security', 'O06b ni siquiera como staff');
end $$;

select set_config('app.user_id', '00000000-0000-0000-0000-0000000000f2', false);
do $$
declare n int;
begin
  perform pg_temp.t_err(
    $q$insert into public.organization_members (organization_id, user_id, role)
       values ('f0f0f0f0-0000-0000-0000-000000000001',
               '00000000-0000-0000-0000-0000000000f5', 'owner')$q$,
    'row-level security', 'O07a admin no crea owners');
  insert into public.organization_members (organization_id, user_id, role)
  values ('f0f0f0f0-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-0000000000f5', 'staff');
  select count(*) into n from public.organization_members
   where organization_id = 'f0f0f0f0-0000-0000-0000-000000000001'
     and user_id = '00000000-0000-0000-0000-0000000000f5';
  perform pg_temp.t_ok(n = 1, 'O07b admin sí agrega staff');
end $$;

-- ---------- O08-O11 · guardia de owners (QA-C3) ------------------------------

-- admin: no se asciende, no toca al owner
select set_config('app.user_id', '00000000-0000-0000-0000-0000000000f2', false);
do $$
begin
  perform pg_temp.t_err(
    $q$update public.organization_members set role = 'owner'
        where user_id = '00000000-0000-0000-0000-0000000000f2'$q$,
    'owner_required', 'O08 admin no se asciende a owner');
  perform pg_temp.t_err(
    $q$update public.organization_members set status = 'suspended'
        where user_id = '00000000-0000-0000-0000-0000000000f1'$q$,
    'owner_required', 'O09a admin no suspende al owner');
  perform pg_temp.t_err(
    $q$update public.organization_members set role = 'staff'
        where user_id = '00000000-0000-0000-0000-0000000000f1'$q$,
    'owner_required', 'O09b admin no degrada al owner');
  perform pg_temp.t_err(
    $q$delete from public.organization_members
        where user_id = '00000000-0000-0000-0000-0000000000f1'$q$,
    'owner_required', 'O09c admin no elimina al owner');
end $$;

-- único owner: no puede dejar la org huérfana
select set_config('app.user_id', '00000000-0000-0000-0000-0000000000f1', false);
do $$
begin
  perform pg_temp.t_err(
    $q$update public.organization_members set role = 'admin'
        where user_id = '00000000-0000-0000-0000-0000000000f1'$q$,
    'last_owner', 'O10a único owner no se degrada');
  perform pg_temp.t_err(
    $q$update public.organization_members set status = 'suspended'
        where user_id = '00000000-0000-0000-0000-0000000000f1'$q$,
    'last_owner', 'O10b único owner no se suspende');
  perform pg_temp.t_err(
    $q$delete from public.organization_members
        where user_id = '00000000-0000-0000-0000-0000000000f1'$q$,
    'last_owner', 'O10c único owner no se elimina');
end $$;

-- traspaso: el owner asciende a otro y luego puede salir
do $$
declare n int;
begin
  update public.organization_members set role = 'owner'
   where user_id = '00000000-0000-0000-0000-0000000000f2';
  update public.organization_members set role = 'admin'
   where user_id = '00000000-0000-0000-0000-0000000000f1';
  select count(*) into n from public.organization_members
   where organization_id = 'f0f0f0f0-0000-0000-0000-000000000001'
     and role = 'owner' and status = 'active';
  perform pg_temp.t_ok(n = 1, 'O11 traspaso de ownership: queda exactamente 1 owner');
end $$;

-- el nuevo owner es ahora el protegido
select set_config('app.user_id', '00000000-0000-0000-0000-0000000000f2', false);
do $$
begin
  perform pg_temp.t_err(
    $q$update public.organization_members set role = 'staff'
        where user_id = '00000000-0000-0000-0000-0000000000f2'$q$,
    'last_owner', 'O12 el nuevo único owner tampoco se degrada');
end $$;

reset role;

-- ---------- O13 · borrar la organización en cascada no choca con el guard ----
select set_config('app.user_id', '', false);
do $$
declare n int;
begin
  delete from public.organizations where id = 'f0f0f0f0-0000-0000-0000-000000000001';
  select count(*) into n from public.organization_members
   where organization_id = 'f0f0f0f0-0000-0000-0000-000000000001';
  perform pg_temp.t_ok(n = 0, 'O13 borrar la org elimina sus miembros (cascada)');
end $$;

do $$ begin raise notice '===== E2E ORG BOOTSTRAP: TODOS LOS TESTS PASARON ====='; end $$;
