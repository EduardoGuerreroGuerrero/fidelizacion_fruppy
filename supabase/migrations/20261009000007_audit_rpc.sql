-- ============================================================================
-- write_audit_log: auditoría atribuible sin service_role.
-- El actor sale de auth.uid() (no se puede falsificar) y se exige membresía
-- activa en la org. Sustituye al insert directo vía service_role en el servidor.
-- ============================================================================

create or replace function public.write_audit_log(
  p_org         uuid,
  p_action      text,
  p_entity_type text,
  p_entity_id   text default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if auth.uid() is null
     or p_org not in (select public.current_user_org_ids()) then
    raise exception 'not_authorized';
  end if;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    p_org, auth.uid(), p_action, p_entity_type, p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_audit_log(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.write_audit_log(uuid, text, text, text, jsonb) to authenticated;
