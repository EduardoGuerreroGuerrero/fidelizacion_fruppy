-- ============================================================================
-- scan_card con soporte de programas por PUNTOS
--
-- Antes scan_card solo otorgaba sellos (hardcodeado), aun si la tarjeta
-- pertenecía a un programa de puntos. Ahora el servidor (la función) decide
-- según el tipo de programa de la cuenta:
--   * stamps → p_stamps sellos (igual que antes; p_amount se ignora)
--   * points → puntos = floor(p_amount * points_per_currency_unit); se exige
--              p_amount > 0. Si el monto es tan bajo que da 0 puntos, solo
--              se registra la visita.
-- p_amount va en unidades de moneda (p. ej. 15000 COP). El nuevo parámetro es
-- opcional y va al final: las llamadas existentes siguen funcionando.
-- Devuelve la proyección pública + points_earned.
-- ============================================================================

drop function if exists public.scan_card(text, int, uuid, text);

create or replace function public.scan_card(
  p_token           text,
  p_stamps          int     default 1,
  p_location_id     uuid    default null,
  p_idempotency_key text    default null,
  p_amount          numeric default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card   record;
  v_prog   record;
  v_tx     uuid;
  v_scans  int;
  v_points bigint := 0;
begin
  select c.id, c.organization_id, c.customer_id, c.account_id, c.status
    into v_card
    from public.customer_cards c
   where c.token = p_token;
  if not found then raise exception 'card_not_found'; end if;
  if v_card.status <> 'active' then raise exception 'card_revoked'; end if;

  if not public.current_user_has_role(
        v_card.organization_id, array['owner','admin','manager','staff']) then
    raise exception 'forbidden';
  end if;

  select p.program_type, p.points_per_currency_unit
    into v_prog
    from public.loyalty_accounts a
    join public.loyalty_programs p on p.id = a.program_id
   where a.id = v_card.account_id;

  if v_prog.program_type = 'points' then
    if p_amount is null or p_amount <= 0 or p_amount > 1000000000 then
      raise exception 'amount_required';
    end if;
    v_points := floor(p_amount * coalesce(v_prog.points_per_currency_unit, 0));
  end if;

  -- Rate limit: máx. 60 escaneos/minuto por empleado.
  select count(*) into v_scans
    from public.customer_visits
   where performed_by = auth.uid()
     and created_at > now() - interval '1 minute';
  if v_scans >= 60 then raise exception 'rate_limited'; end if;

  -- Idempotencia a nivel de org para retries del cliente.
  if p_idempotency_key is not null then
    select id into v_tx from public.loyalty_transactions
     where organization_id = v_card.organization_id
       and idempotency_key = p_idempotency_key;
    if found then
      return (select public.get_card_public(p_token));
    end if;
  end if;

  -- Visita + earn en una transacción (earn valida y actualiza saldo).
  insert into public.customer_visits (
    organization_id, customer_id, location_id, performed_by,
    source, idempotency_key
  ) values (
    v_card.organization_id, v_card.customer_id, p_location_id, auth.uid(),
    'staff_qr', p_idempotency_key
  );

  if v_prog.program_type = 'points' then
    if v_points > 0 then
      v_tx := public.earn(
        v_card.account_id, v_points, 0, round(p_amount * 100)::bigint,
        p_location_id, p_idempotency_key, 'qr_scan'
      );
    end if;
  elsif p_stamps > 0 then
    v_tx := public.earn(
      v_card.account_id, 0, p_stamps, null, p_location_id,
      p_idempotency_key, 'qr_scan'
    );
  end if;

  return (public.get_card_public(p_token)::jsonb
          || jsonb_build_object('points_earned', v_points))::json;
end;
$$;

revoke all on function public.scan_card(text, int, uuid, text, numeric) from public, anon;
grant execute on function public.scan_card(text, int, uuid, text, numeric) to authenticated;
