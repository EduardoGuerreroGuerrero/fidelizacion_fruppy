-- ============================================================================
-- Fase 8 — Analítica básica
--
-- org_analytics(org_id, days): métricas agregadas server-side, security
-- definer + verificación de membresía. Fuente única de verdad para el
-- dashboard — cada número es reconciliable con las tablas de origen.
-- Buckets de día en la zona horaria de la organización (org.timezone).
-- Definiciones completas: docs/ANALYTICS.md
-- ============================================================================

create or replace function public.org_analytics(p_org uuid, p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz        text;
  v_since     timestamptz;
  v_days      int := greatest(1, least(coalesce(p_days, 30), 365));
  v_out       jsonb;
  v_visitors  bigint;
  v_returners bigint;
begin
  if auth.uid() is null
     or p_org not in (select public.current_user_org_ids()) then
    raise exception 'not_authorized';
  end if;

  select coalesce(nullif(o.timezone, ''), 'UTC')
    into v_tz
    from public.organizations o
   where o.id = p_org;
  v_tz := coalesce(v_tz, 'UTC');

  -- El período se corta en medianoche local de la org (día actual inclusive).
  v_since := (((now() at time zone v_tz)::date - (v_days - 1))
              at time zone v_tz);

  with visits as (
    select v.* from public.customer_visits v
     where v.organization_id = p_org and v.created_at >= v_since
  ),
  txs as (
    select t.* from public.loyalty_transactions t
     where t.organization_id = p_org and t.created_at >= v_since
  ),
  daily as (
    select jsonb_agg(
             jsonb_build_object('day', dd.d::text, 'count', coalesce(vc.n, 0))
             order by dd.d
           ) as arr
      from (
        select ((now() at time zone v_tz)::date - g.i) as d
          from generate_series(0, v_days - 1) as g(i)
      ) dd
      left join (
        select (created_at at time zone v_tz)::date as d, count(*) as n
          from visits group by 1
      ) vc on vc.d = dd.d
  )
  select jsonb_build_object(
    'generated_at', now(),
    'timezone', v_tz,
    'days', v_days,
    'since', v_since,
    'customers_total', (
      select count(*) from public.customers
       where organization_id = p_org and status = 'active'),
    'customers_new', (
      select count(*) from public.customers
       where organization_id = p_org and created_at >= v_since),
    'customers_active', (
      select count(*) from (
        select customer_id from visits
        union
        select a.customer_id
          from txs t
          join public.loyalty_accounts a on a.id = t.account_id
      ) u),
    'visits_total', (select count(*) from visits),
    'visits_daily', coalesce((select arr from daily), '[]'::jsonb),
    'points_earned', coalesce((
      select sum(points_delta) from txs where transaction_type = 'earn'), 0),
    'points_redeemed', coalesce((
      select -sum(points_delta) from txs
       where transaction_type = 'redeem' and points_delta < 0), 0),
    'stamps_earned', coalesce((
      select sum(stamps_delta) from txs where transaction_type = 'earn'), 0),
    'stamps_redeemed', coalesce((
      select -sum(stamps_delta) from txs
       where transaction_type = 'redeem' and stamps_delta < 0), 0),
    'rewards_issued', (
      select count(*) from public.rewards
       where organization_id = p_org and status = 'active'),
    'redemptions_completed', (
      select count(*) from public.redemptions
       where organization_id = p_org and status = 'completed'
         and created_at >= v_since),
    'redemptions_reversed', (
      select count(*) from public.redemptions
       where organization_id = p_org and status = 'reversed'
         and created_at >= v_since)
  ) into v_out;

  -- Tasa de retorno: clientes con ≥2 visitas / clientes con ≥1 visita,
  -- ambos dentro del período. Documentado en docs/ANALYTICS.md.
  with visits as (
    select v.* from public.customer_visits v
     where v.organization_id = p_org and v.created_at >= v_since
  ),
  per_cust as (
    select count(*) as n from visits group by customer_id
  )
  select count(*), count(*) filter (where n >= 2)
    into v_visitors, v_returners
    from per_cust;

  v_out := v_out || jsonb_build_object(
    'return_rate',
    case when v_visitors > 0
         then round(v_returners::numeric / v_visitors::numeric, 4)
         else null end,
    'return_rate_numerator', v_returners,
    'return_rate_denominator', v_visitors
  );

  return v_out;
end;
$$;

revoke all on function public.org_analytics(uuid, int) from public, anon;
grant execute on function public.org_analytics(uuid, int) to authenticated;
