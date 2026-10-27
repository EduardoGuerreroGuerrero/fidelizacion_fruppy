-- ============================================================================
-- Eliminar programas (hoy solo existía "Archivar").
--
-- Reglas (el ledger es append-only: regla 2 del plan rector):
--  * Solo owner/admin del comercio.
--  * Solo un programa ARCHIVADO (flujo en dos pasos: archivar → eliminar).
--  * Nunca si tiene movimientos (loyalty_transactions) o canjes: tiene
--    historial y permanece archivado. Las FK `on delete restrict` ya lo
--    impedirían; aquí se comprueba antes para dar un motivo claro.
--  * Sin historial, eliminar arrastra por `on delete cascade` las cuentas,
--    tarjetas, premios y pases de wallet del programa. El servidor revoca los
--    pases en Google/Apple ANTES de llamar a esta función.
-- ============================================================================

create or replace function public.program_delete_summary(p_program_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prog   record;
  v_accts  int;
  v_cards  int;
  v_rewards int;
  v_passes int;
  v_tx     int;
  v_red    int;
  v_reason text;
begin
  select p.id, p.organization_id, p.name, p.status
    into v_prog
    from public.loyalty_programs p
   where p.id = p_program_id;
  if not found then
    return json_build_object('ok', false, 'error', 'program_not_found');
  end if;
  if not public.current_user_has_role(v_prog.organization_id, array['owner','admin']) then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;

  select count(*) into v_accts
    from public.loyalty_accounts where program_id = p_program_id;
  select count(*) into v_cards
    from public.customer_cards c
    join public.loyalty_accounts a on a.id = c.account_id
   where a.program_id = p_program_id;
  select count(*) into v_rewards
    from public.rewards where program_id = p_program_id;
  select count(*) into v_passes
    from public.wallet_passes where program_id = p_program_id;
  select count(*) into v_tx
    from public.loyalty_transactions t
    join public.loyalty_accounts a on a.id = t.account_id
   where a.program_id = p_program_id;
  select count(*) into v_red
    from public.redemptions r
    join public.loyalty_accounts a on a.id = r.account_id
   where a.program_id = p_program_id;

  v_reason := case
    when v_prog.status <> 'archived' then 'not_archived'
    when v_tx > 0 or v_red > 0 then 'has_history'
    else null
  end;

  return json_build_object(
    'ok', true,
    'name', v_prog.name,
    'status', v_prog.status,
    'can_delete', v_reason is null,
    'reason', v_reason,
    'accounts', v_accts,
    'cards', v_cards,
    'rewards', v_rewards,
    'passes', v_passes,
    'transactions', v_tx,
    'redemptions', v_red
  );
end;
$$;

revoke all on function public.program_delete_summary(uuid) from public, anon;
grant execute on function public.program_delete_summary(uuid) to authenticated;

create or replace function public.delete_program(p_program_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_summary json;
begin
  -- Misma comprobación que el resumen, dentro de la misma transacción: no se
  -- confía en lo que el cliente haya visto antes.
  v_summary := public.program_delete_summary(p_program_id);
  if not (v_summary ->> 'ok')::boolean then
    return v_summary;
  end if;
  if not (v_summary ->> 'can_delete')::boolean then
    return json_build_object('ok', false, 'error', v_summary ->> 'reason');
  end if;

  delete from public.loyalty_programs where id = p_program_id;

  return json_build_object(
    'ok', true,
    'accounts', (v_summary ->> 'accounts')::int,
    'cards', (v_summary ->> 'cards')::int,
    'rewards', (v_summary ->> 'rewards')::int,
    'passes', (v_summary ->> 'passes')::int
  );
end;
$$;

revoke all on function public.delete_program(uuid) from public, anon;
grant execute on function public.delete_program(uuid) to authenticated;
