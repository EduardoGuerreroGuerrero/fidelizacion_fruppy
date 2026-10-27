-- ============================================================================
-- Rate limit genérico (ventana fija) para endpoints públicos caros o con
-- efectos externos (correo, push, Google Wallet). Solo lo invoca el servidor
-- con service_role: `anon`/`authenticated` no pueden llamarlo (si pudieran,
-- cualquiera inflaría la tabla o agotaría la cuota de otro).
-- La clave es un hash (nunca IP ni token en claro). El cron diario borra las
-- ventanas con más de un día.
-- ============================================================================

create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  hits         int         not null default 1,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
-- Sin políticas ni grants: solo service_role (que ignora RLS) y funciones definer.
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(
  p_key            text,
  p_limit          int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_hits  int;
begin
  -- Parámetros inválidos: no bloquear (falla abierta) pero tampoco contar.
  if p_key is null or p_limit < 1 or p_window_seconds < 1 then
    return true;
  end if;

  v_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_start, 1)
  on conflict (key, window_start)
  do update set hits = r.hits + 1
  returning r.hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

-- service_role conserva EXECUTE por los privilegios por defecto de Supabase.
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
