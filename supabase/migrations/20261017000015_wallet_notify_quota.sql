-- Cuota de mensajes TEXT_AND_NOTIFY de Google Wallet (máx. 3 por pase/24h).
-- Se rastrea por fila espejo para dejar de notificar sin gastar llamadas a
-- la API ni chocar con el 429: agotada la ventana se degrada a TEXT (el
-- mensaje queda visible dentro del pase, sin alerta en el teléfono).

alter table public.wallet_passes
  add column if not exists notify_count int not null default 0,
  add column if not exists notify_window_start timestamptz;

comment on column public.wallet_passes.notify_count is
  'Mensajes TEXT_AND_NOTIFY enviados en la ventana actual (máx. 3 por pase/24h).';
comment on column public.wallet_passes.notify_window_start is
  'Inicio de la ventana de 24h para notify_count; null = sin mensajes aún.';
