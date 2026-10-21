-- ============================================================================
-- 0018 · get_card_app_data expone la marca del comercio  (QA-C4)
-- ============================================================================
-- La app del cliente mostraba el logo/fotos de Fruppy en TODOS los comercios.
-- Se añaden org_id (para /logo/[orgId]), org_slug, brand_color y has_logo.
-- Solo identificadores y datos de marca ya públicos (QR /join, Wallet).
-- ============================================================================

create or replace function public.get_card_app_data(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
begin
  select c.status, c.organization_id, c.customer_id,
         o.name as org_name, o.slug as org_slug, o.brand, o.features, o.legal,
         cu.first_name, cu.data_consent_at,
         p.id as program_id, p.name as program_name, p.program_type,
         p.stamp_goal, p.reward_description,
         a.current_stamps, a.current_points
    into v
    from public.customer_cards c
    join public.organizations o on o.id = c.organization_id
    join public.customers cu on cu.id = c.customer_id
    join public.loyalty_accounts a on a.id = c.account_id
    join public.loyalty_programs p on p.id = a.program_id
   where c.token = p_token;
  if not found then return null; end if;

  return json_build_object(
    'org_id',             v.organization_id,
    'org_slug',           v.org_slug,
    'org_name',           v.org_name,
    'brand_color',        v.brand ->> 'color',
    'has_logo',           coalesce(v.brand ->> 'logo_url', '') <> '',
    'first_name',         v.first_name,
    'program_name',       v.program_name,
    'program_type',       v.program_type,
    'stamp_goal',         v.stamp_goal,
    'reward_description', v.reward_description,
    'current_stamps',     v.current_stamps,
    'current_points',     v.current_points,
    'card_status',        v.status,
    'consent_pending',    v.data_consent_at is null,
    'location_enabled',   coalesce((v.features ->> 'location')::boolean, false),
    'wallet_enabled',     coalesce((v.features ->> 'wallet')::boolean, true),
    'stamp_icon',         coalesce(v.brand ->> 'stamp_icon', 'strawberry'),
    'policy_text',        v.legal ->> 'policy_text',
    'data_controller',    coalesce(v.legal ->> 'data_controller', v.org_name),
    'privacy_email',      v.legal ->> 'privacy_email',
    'rewards', (
      select coalesce(json_agg(json_build_object(
        'id',          r.id,
        'name',        r.name,
        'description', r.description,
        'cost_stamps', r.cost_stamps,
        'cost_points', r.cost_points,
        'terms',       r.terms
      ) order by r.cost_stamps asc nulls last, r.cost_points asc nulls last, r.name), '[]'::json)
      from public.rewards r
      where r.program_id = v.program_id and r.status = 'active'
    ),
    'locations', (
      select coalesce(json_agg(json_build_object(
        'id',      l.id,
        'name',    l.name,
        'address', l.address,
        'lat',     l.lat,
        'lng',     l.lng
      ) order by l.name), '[]'::json)
      from public.locations l
      where l.organization_id = v.organization_id and l.status = 'active'
    ),
    'visits', (
      select coalesce(json_agg(json_build_object(
        'visited_at', vv.created_at,
        'location',   vv.location_name,
        'stamps',     vv.stamps_delta
      ) order by vv.created_at desc), '[]'::json)
      from (
        select cv.created_at, l.name as location_name,
               coalesce(t.stamps_delta, 0) as stamps_delta
          from public.customer_visits cv
          left join public.locations l on l.id = cv.location_id
          left join public.loyalty_transactions t
            on t.organization_id = cv.organization_id
           and t.idempotency_key = cv.idempotency_key
           and t.transaction_type = 'earn'
         where cv.customer_id = v.customer_id
           and cv.organization_id = v.organization_id
         order by cv.created_at desc
         limit 5
      ) vv
    ),
    'redemptions', (
      select coalesce(json_agg(json_build_object(
        'id',          rr.id,
        'reward',      rr.reward_name,
        'redeemed_at', rr.created_at,
        'location',    rr.location_name
      ) order by rr.created_at desc), '[]'::json)
      from (
        select rd.id, r.name as reward_name, rd.created_at, l.name as location_name
          from public.redemptions rd
          join public.rewards r on r.id = rd.reward_id
          left join public.locations l on l.id = rd.location_id
         where rd.customer_id = v.customer_id and rd.status = 'completed'
         order by rd.created_at desc
         limit 10
      ) rr
    )
  );
end;
$$;

revoke all on function public.get_card_app_data(text) from public;
grant execute on function public.get_card_app_data(text) to anon, authenticated;
