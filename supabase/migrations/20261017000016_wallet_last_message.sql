-- Último mensaje wallet por pase. Google Wallet acumula messages[] en el
-- objeto; para mostrar solo el más reciente, wallet.update() reescribe el
-- array desde content.google.messages, que se reconstruye desde aquí.
-- sendPassMessage lo guarda tras cada envío exitoso y dispara un update.

alter table public.wallet_passes
  add column if not exists last_message jsonb;

comment on column public.wallet_passes.last_message is
  'Último mensaje enviado al pase {header, body, sent_at}; update() reescribe messages[] solo con este.';
