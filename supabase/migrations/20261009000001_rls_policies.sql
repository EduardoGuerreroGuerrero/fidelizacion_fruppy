-- ============================================================================
-- 0002 · Políticas RLS — identidad, organizaciones y aislamiento (Fase 2)
-- ============================================================================
-- Principios:
--  * Deny-all por defecto (RLS ya ON desde 0001). Solo se abre lo necesario.
--  * Las policies NUNCA consultan la misma tabla que protegen sin pasar por una
--    función security definer → evita recursión infinita de RLS.
--  * Lectura de negocio: solo miembros activos de la organización.
--  * Escritura de negocio: owner/admin/manager. staff es read-only a nivel de
--    tabla; sus acciones privilegiadas irán por RPC security definer (Fase 4).
--  * Ledger/auditoría: sin INSERT/UPDATE/DELETE directo para roles de API.
-- ============================================================================

-- ---------- helpers security definer ----------------------------------------
-- security definer = corre como el dueño (postgres) → bypasea RLS dentro de la
-- función. search_path fijado a '' previene secuestro de search_path.

create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
    from public.organization_members
   where user_id = auth.uid()
     and status = 'active';
$$;

create or replace function public.current_user_has_role(
  p_org_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.organization_members
     where organization_id = p_org_id
       and user_id = auth.uid()
       and status = 'active'
       and role = any(p_roles)
  );
$$;

revoke all on function public.current_user_org_ids() from public, anon;
revoke all on function public.current_user_has_role(uuid, text[]) from public, anon;
grant execute on function public.current_user_org_ids() to authenticated;
grant execute on function public.current_user_has_role(uuid, text[]) to authenticated;

-- ---------- organizations ----------------------------------------------------

-- Cualquier usuario autenticado puede crear una organización (queda owner por
-- la policy de organization_members abajo). Nadie lee orgs ajenas.
create policy org_select_member on public.organizations
  for select to authenticated
  using (id in (select public.current_user_org_ids()));

create policy org_insert_authenticated on public.organizations
  for insert to authenticated
  with check (auth.uid() is not null);

create policy org_update_admin on public.organizations
  for update to authenticated
  using (public.current_user_has_role(id, array['owner','admin']))
  with check (public.current_user_has_role(id, array['owner','admin']));

-- ---------- organization_members ---------------------------------------------

create policy members_select_member on public.organization_members
  for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));

-- Insert: (a) bootstrapping — uno mismo como owner de una org recién creada;
-- (b) owner/admin de la org invitando a otros.
create policy members_insert on public.organization_members
  for insert to authenticated
  with check (
    (user_id = auth.uid() and role = 'owner')
    or public.current_user_has_role(organization_id, array['owner','admin'])
  );

create policy members_update_admin on public.organization_members
  for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']))
  with check (public.current_user_has_role(organization_id, array['owner','admin']));

create policy members_delete_admin on public.organization_members
  for delete to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']));

-- ---------- tablas de negocio: patrón común ----------------------------------
-- SELECT: miembros activos. INSERT/UPDATE: owner/admin/manager.
-- DELETE: owner/admin. Sin DELETE en customers (baja lógica por status).

-- locations
create policy locations_select on public.locations for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));
create policy locations_insert on public.locations for insert to authenticated
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager']));
create policy locations_update on public.locations for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']))
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager']));
create policy locations_delete on public.locations for delete to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']));

-- customers
create policy customers_select on public.customers for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));
create policy customers_insert on public.customers for insert to authenticated
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager','staff']));
create policy customers_update on public.customers for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin','manager']))
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager']));

-- loyalty_programs
create policy programs_select on public.loyalty_programs for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));
create policy programs_insert on public.loyalty_programs for insert to authenticated
  with check (public.current_user_has_role(organization_id, array['owner','admin']));
create policy programs_update on public.loyalty_programs for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']))
  with check (public.current_user_has_role(organization_id, array['owner','admin']));

-- loyalty_accounts: lectura para miembros; saldos solo cambian por RPC (Fase 4)
create policy accounts_select on public.loyalty_accounts for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));

-- loyalty_transactions: lectura para miembros; escritura SOLO por RPC
-- (INSERT sin policy = prohibido para authenticated/anon)
create policy ledger_select on public.loyalty_transactions for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));

-- rewards
create policy rewards_select on public.rewards for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));
create policy rewards_insert on public.rewards for insert to authenticated
  with check (public.current_user_has_role(organization_id, array['owner','admin']));
create policy rewards_update on public.rewards for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']))
  with check (public.current_user_has_role(organization_id, array['owner','admin']));
create policy rewards_delete on public.rewards for delete to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']));

-- redemptions: lectura para miembros; INSERT por RPC (canje atómico, Fase 4)
create policy redemptions_select on public.redemptions for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));
-- reversals cambian status a 'reversed' — solo owner/admin, nunca delete
create policy redemptions_update on public.redemptions for update to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']))
  with check (public.current_user_has_role(organization_id, array['owner','admin'])
              and status = 'reversed' and reversed_at is not null);

-- customer_visits: lectura miembros; INSERT por flujo staff (validación de
-- rol se hará también en servidor; staff puede registrar visitas)
create policy visits_select on public.customer_visits for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));
create policy visits_insert on public.customer_visits for insert to authenticated
  with check (public.current_user_has_role(organization_id, array['owner','admin','manager','staff'])
              and performed_by = auth.uid());

-- wallet_passes: lectura miembros; escritura solo por service_role (sync Wallet)
create policy wallet_select on public.wallet_passes for select to authenticated
  using (organization_id in (select public.current_user_org_ids()));

-- audit_logs: lectura owner/admin; escritura solo por server (service_role)
create policy audit_select on public.audit_logs for select to authenticated
  using (public.current_user_has_role(organization_id, array['owner','admin']));
