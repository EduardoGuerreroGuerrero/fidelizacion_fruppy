-- ============================================================================
-- Grants de tabla para el rol `authenticated`.
-- En Supabase ya vienen vía default privileges; esta migración los hace
-- explícitos para que el esquema sea portable a Postgres plano (Neon, CI).
-- RLS sigue siendo la frontera real: los grants solo habilitan el intento.
-- ============================================================================

grant select on public.organizations          to authenticated;
grant insert on public.organizations          to authenticated;
grant update on public.organizations          to authenticated;

grant select on public.organization_members   to authenticated;
grant insert on public.organization_members   to authenticated;
grant update on public.organization_members   to authenticated;
grant delete on public.organization_members   to authenticated;

grant select on public.locations              to authenticated;
grant insert on public.locations              to authenticated;
grant update on public.locations              to authenticated;
grant delete on public.locations              to authenticated;

grant select on public.customers              to authenticated;
grant insert on public.customers              to authenticated;
grant update on public.customers              to authenticated;

grant select on public.loyalty_programs       to authenticated;
grant insert on public.loyalty_programs       to authenticated;
grant update on public.loyalty_programs       to authenticated;

grant select on public.loyalty_accounts       to authenticated;
-- INSERT/UPDATE/DELETE en accounts solo vía funciones security definer

grant select on public.loyalty_transactions   to authenticated;
-- ledger append-only: sin INSERT/UPDATE/DELETE para authenticated

grant select on public.rewards                to authenticated;
grant insert on public.rewards                to authenticated;
grant update on public.rewards                to authenticated;
grant delete on public.rewards                to authenticated;

grant select on public.redemptions            to authenticated;
grant update on public.redemptions            to authenticated;
-- INSERT en redemptions solo vía redeem_reward()

grant select on public.customer_visits        to authenticated;
grant insert on public.customer_visits        to authenticated;

grant select on public.wallet_passes          to authenticated;
-- escritura en wallet_passes solo service_role / funciones

grant select on public.audit_logs             to authenticated;
-- audit append-only: sin escritura para authenticated
