-- ============================================================================
-- 0021 · Cerrar / eliminar organizaciones + columnas privilegiadas   (QA-P2)
-- ============================================================================
--  * Cerrar (soft): status 'closed'. Revoca tarjetas, borra suscripciones push,
--    cancela campañas y reservas pendientes. El historial (ledger) se conserva
--    — el ledger referencia a la organización con ON DELETE RESTRICT.
--  * Eliminar (hard): solo si la organización NUNCA tuvo movimientos, visitas
--    ni canjes (p. ej. una org creada por error). Exige escribir el slug.
--  * Endurecimiento: `status` y `limits` son del plan/soporte, NO del comercio.
--    Un admin podía reactivar una org suspendida o subirse sus propios límites
--    con un UPDATE directo. Ahora solo puede escribir las columnas de
--    Configuración (name, currency, timezone, brand, legal, features).
-- ============================================================================

-- ---------- estado 'closed' ---------------------------------------------------

alter table public.organizations drop constraint if exists organizations_status_check;
alter table public.organizations add constraint organizations_status_check
  check (status in ('trial', 'active', 'suspended', 'closed'));

-- ---------- columnas privilegiadas -------------------------------------------

revoke update on public.organizations from authenticated;
grant update (name, currency, timezone, brand, legal, features)
  on public.organizations to authenticated;

-- ---------- close_organization -----------------------------------------------

create or replace function public.close_organization(p_org_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cards int;
begin
  if not public.current_user_has_role(p_org_id, array['owner']) then
    raise exception 'forbidden';
  end if;
  if not exists (select 1 from public.organizations where id = p_org_id and status <> 'closed') then
    raise exception 'already_closed';
  end if;

  update public.organizations set status = 'closed' where id = p_org_id;

  update public.customer_cards
     set status = 'revoked', revoked_at = now()
   where organization_id = p_org_id and status = 'active';
  get diagnostics v_cards = row_count;

  delete from public.push_subscriptions where organization_id = p_org_id;
  update public.push_campaigns set status = 'cancelled'
   where organization_id = p_org_id and status in ('draft', 'scheduled');
  update public.organization_invites set status = 'cancelled'
   where organization_id = p_org_id and status = 'pending';

  return json_build_object('ok', true, 'cards_revoked', v_cards);
end;
$$;

revoke all on function public.close_organization(uuid) from public, anon;
grant execute on function public.close_organization(uuid) to authenticated;

-- ---------- delete_organization ----------------------------------------------

create or replace function public.delete_organization(p_org_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  if not public.current_user_has_role(p_org_id, array['owner']) then
    raise exception 'forbidden';
  end if;

  select slug into v_slug from public.organizations where id = p_org_id;
  if v_slug is null then raise exception 'org_not_found'; end if;
  if v_slug <> btrim(coalesce(p_slug, '')) then raise exception 'slug_mismatch'; end if;

  if exists (select 1 from public.loyalty_transactions where organization_id = p_org_id)
     or exists (select 1 from public.customer_visits where organization_id = p_org_id)
     or exists (select 1 from public.redemptions where organization_id = p_org_id) then
    raise exception 'has_history';
  end if;

  delete from public.organizations where id = p_org_id;
end;
$$;

revoke all on function public.delete_organization(uuid, text) from public, anon;
grant execute on function public.delete_organization(uuid, text) to authenticated;
