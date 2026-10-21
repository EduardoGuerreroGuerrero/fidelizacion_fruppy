-- ============================================================================
-- 0017 · Alta de organizaciones por RPC + guardia de owners  (QA-C1, C2, C3)
-- ============================================================================
-- Problemas corregidos (auditoría QA 2026-10-21):
--  C1  `insert into organizations ... returning` fallaba con 42501: la policy
--      SELECT exige ser miembro y la membresía se creaba DESPUÉS.
--  C2  members_insert aceptaba `user_id = auth.uid() and role = 'owner'` sin
--      comprobar que la org fuera nueva → cualquiera podía hacerse owner de
--      una org ajena conociendo su id.
--  C3  Se podía dejar una org sin owner (auto-degradación) y un admin podía
--      degradar/suspender a un owner o ascenderse a sí mismo.
-- ============================================================================

-- ---------- C1 · create_organization (org + owner en una transacción) --------

create or replace function public.create_organization(
  p_name  text,
  p_slug  text,
  p_brand jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_owned int;
  v_id    uuid;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  -- Freno de abuso: un usuario no acumula orgs indefinidamente.
  select count(*) into v_owned
    from public.organization_members
   where user_id = v_uid and role = 'owner' and status = 'active';
  if v_owned >= 10 then
    raise exception 'org_limit' using errcode = 'P0001';
  end if;

  -- Los CHECK de la tabla validan nombre y slug; un slug repetido lanza 23505.
  insert into public.organizations (name, slug, brand)
  values (btrim(p_name), p_slug, coalesce(p_brand, '{}'::jsonb))
  returning id into v_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_id, v_uid, 'owner', 'active');

  return v_id;
end;
$$;

revoke all on function public.create_organization(text, text, jsonb) from public, anon;
grant execute on function public.create_organization(text, text, jsonb) to authenticated;

-- Las orgs solo se crean por la RPC (security definer). Sin INSERT directo.
drop policy if exists org_insert_authenticated on public.organizations;
revoke insert on public.organizations from authenticated;

-- ---------- C2 · members_insert sin bootstrap por cuenta propia -------------

drop policy if exists members_insert on public.organization_members;
create policy members_insert on public.organization_members
  for insert to authenticated
  with check (
    -- owner: cualquier rol; admin: cualquiera menos owner.
    public.current_user_has_role(organization_id, array['owner'])
    or (
      role <> 'owner'
      and public.current_user_has_role(organization_id, array['admin'])
    )
  );

-- ---------- C3 · guardia de owners -------------------------------------------
-- BEFORE UPDATE/DELETE en organization_members:
--  * un owner activo solo lo degrada/suspende/elimina OTRO owner (si hay
--    sesión de usuario; service_role/migraciones no tienen auth.uid());
--  * nunca se puede dejar la organización sin owner activo;
--  * solo un owner puede ascender a alguien a owner.
-- Mensajes estables ('owner_required', 'last_owner') para mapear en la UI.

create or replace function public.guard_org_owners()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor          uuid := auth.uid();
  v_actor_is_owner boolean;
  v_other_owners   int;
begin
  -- Cascada por borrado de la organización: no hay nada que proteger.
  if tg_op = 'DELETE'
     and not exists (select 1 from public.organizations where id = old.organization_id) then
    return old;
  end if;

  if tg_op = 'UPDATE' and new.role = old.role and new.status = old.status then
    return new;
  end if;

  v_actor_is_owner :=
    public.current_user_has_role(old.organization_id, array['owner']);

  -- Tocar a un owner activo (degradar, suspender o eliminar).
  if old.role = 'owner' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active') then
    if v_actor is not null and not v_actor_is_owner then
      raise exception 'owner_required' using errcode = '42501';
    end if;
    select count(*) into v_other_owners
      from public.organization_members
     where organization_id = old.organization_id
       and role = 'owner' and status = 'active'
       and id <> old.id;
    if v_other_owners = 0 then
      raise exception 'last_owner' using errcode = 'P0001';
    end if;
  end if;

  -- Ascender a owner.
  if tg_op = 'UPDATE' and new.role = 'owner' and old.role <> 'owner'
     and v_actor is not null and not v_actor_is_owner then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists organization_members_guard_owners on public.organization_members;
create trigger organization_members_guard_owners
  before update or delete on public.organization_members
  for each row execute function public.guard_org_owners();
