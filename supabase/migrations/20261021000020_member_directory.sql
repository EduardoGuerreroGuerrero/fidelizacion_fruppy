-- ============================================================================
-- 0020 · Directorio de miembros con correo y nombre   (QA-B2)
-- ============================================================================
-- La pantalla de Equipo listaba a los miembros por UUID. auth.users no es
-- legible desde la API: esta RPC (security definer) devuelve correo y nombre
-- SOLO de los miembros de una organización y SOLO a owner/admin/manager de
-- esa misma organización.
-- ============================================================================

create or replace function public.org_member_directory(p_org_id uuid)
returns table (
  member_id  uuid,
  user_id    uuid,
  email      text,
  full_name  text,
  role       text,
  status     text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_has_role(p_org_id, array['owner','admin','manager']) then
    raise exception 'forbidden';
  end if;

  return query
    select m.id,
           m.user_id,
           u.email::text,
           nullif(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
           m.role,
           m.status,
           m.created_at
      from public.organization_members m
      join auth.users u on u.id = m.user_id
     where m.organization_id = p_org_id
     order by m.created_at;
end;
$$;

revoke all on function public.org_member_directory(uuid) from public, anon;
grant execute on function public.org_member_directory(uuid) to authenticated;
