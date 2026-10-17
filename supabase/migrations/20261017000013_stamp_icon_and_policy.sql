-- ============================================================================
-- Personalización de sellos + política de tratamiento propia por comercio
--
--  * organizations.brand.stamp_icon: figura del sello elegida por el comercio
--    (fresa, bigote, bandita, huella, café, corazón, estrella, flor). Sin
--    columna nueva — ya vive en el jsonb `brand` junto a color/logo.
--  * organizations.legal.policy_text: texto propio de la política de
--    tratamiento de datos, editable por el comercio (reemplaza la antigua
--    URL externa). get_card_app_data y resolve_join la exponen junto con
--    responsable/correo de privacidad para renderizarla en la app y en el
--    formulario público de alta — ver docs/DATA_POLICY_TEMPLATE.md para el
--    texto por defecto que se precarga en Configuración.
-- ============================================================================

comment on column public.organizations.brand is
  '{"color","logo_url","stamp_icon"}: stamp_icon ∈ strawberry|mustache|bandage|paw|coffee|heart|star|flower.';
comment on column public.organizations.legal is
  '{"privacy_email","data_controller","consent_version","policy_text"}. policy_text reemplaza policy_url: texto propio editable por el comercio, mostrado en /join y en la tarjeta.';

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
         o.name as org_name, o.brand, o.features, o.legal,
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
    'org_name',           v.org_name,
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

-- ---------- resolve_join: + policy_text (reemplaza policy_url en el join) ----

create or replace function public.resolve_join(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org  record;
  v_prog record;
begin
  select o.id, o.name, o.status, o.brand, o.legal, o.features
    into v_org
    from public.organizations o
   where o.join_token = p_token;
  if not found then return null; end if;

  if v_org.status not in ('active','trial')
     or coalesce((v_org.features ->> 'self_registration')::boolean, true) = false then
    return json_build_object('ok', false, 'reason', 'unavailable');
  end if;

  select p.id, p.name, p.program_type
    into v_prog
    from public.loyalty_programs p
   where p.organization_id = v_org.id and p.status = 'active'
   order by p.created_at
   limit 1;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_program');
  end if;

  return json_build_object(
    'ok',             true,
    'org_name',       v_org.name,
    'program_name',   v_prog.name,
    'program_type',   v_prog.program_type,
    'brand_color',    v_org.brand ->> 'color',
    'logo_url',       v_org.brand ->> 'logo_url',
    'privacy_email',  v_org.legal ->> 'privacy_email',
    'policy_url',     v_org.legal ->> 'policy_url',
    'policy_text',    v_org.legal ->> 'policy_text',
    'data_controller',coalesce(v_org.legal ->> 'data_controller', v_org.name),
    'push_enabled',   coalesce((v_org.features ->> 'push')::boolean, false),
    'location_enabled', coalesce((v_org.features ->> 'location')::boolean, false)
  );
end;
$$;

revoke all on function public.resolve_join(text) from public;
grant execute on function public.resolve_join(text) to anon, authenticated;
