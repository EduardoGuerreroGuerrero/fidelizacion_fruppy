# Límites de gasto y protección de costes

Qué hay en el código y qué se configura a mano en los paneles. **Las secciones 2 y 3
requieren acceso de owner/facturación en Supabase y Vercel y no se pueden hacer desde el
repositorio**: son pasos manuales (marcar como hechos al completarlos).

## 1. Guardas en la aplicación (ya en el código)

| Guarda | Dónde |
|---|---|
| Rate limit en Postgres (`check_rate_limit`) con respaldo en memoria | `lib/ratelimit.ts`, migración `…000024_rate_limits.sql` |
| `/contacto`: 3 mensajes/hora/IP | `lib/contact/actions.ts` |
| Push, consentimiento, preferencias, derechos: 10–30/hora por tarjeta+IP | `app/t/[token]/*/route.ts` |
| «Guardar en Google/Apple Wallet»: 6/hora por tarjeta+IP | `app/t/[token]/wallet/*/route.ts` |
| Imágenes del pase: 120/min/IP, `?v=` inválido redirige a la URL canónica (sin render nuevo), `maxDuration` 10 s | `app/wallet-img/*`, `apps/web/vercel.json` |
| `proxy.ts` no se ejecuta en `/t/*`, `/join/*`, `/logo/*`, `/wallet-img/*` | `apps/web/proxy.ts` (sin llamada a Supabase Auth por petición) |
| Alta por QR: 20/hora por comercio+huella | RPC `register_customer_via_join` |
| Límites por comercio (`organizations.limits`): campañas/mes, suscriptores push | RPC de campañas / push |
| Cron una vez al día + limpieza de `join_attempts` y `rate_limits` | `app/api/cron/drain/route.ts` |

## 2. Supabase (manual)

1. Confirmar el plan (Organización → Billing). El **Spend Cap** existe en Pro.
2. Pro: activar **Spend Cap** (Billing → Cost Control). Impide cobrar excedentes de disco,
   egress, funciones edge, logs, usuarios activos, Realtime y almacenamiento.
   **No cubre el cómputo**, ramas, réplicas, dominio propio, IPv4, IOPS extra, Log Drains ni
   PITR: no activar réplicas ni ramas permanentes, y borrar las ramas de prueba al terminar.
3. No hay alertas por importe: poner un recordatorio mensual para revisar *Usage* (egress y
   almacenamiento) y comprobar que el correo de facturación se lee.

## 3. Vercel (manual)

1. Confirmar el plan. **Spend Management** es de Pro/Enterprise (Hobby no cobra excedentes:
   al pasar los límites se restringe).
2. Pro: Settings → Billing → Spend Management: fijar el importe mensual **por debajo** de lo
   que se tolera (la comprobación tarda unos minutos), activar **Pause production
   deployments**, añadir un webhook/correo y SMS. Revisar el interruptor de pausa en el panel
   (la documentación y el changelog difieren sobre su valor por defecto). Un proyecto pausado
   no se reanuda solo.
3. **Firewall → Rate limiting** (borde): una regla por IP sobre `/wallet-img/*` y otra sobre
   `/contacto`. En Hobby hay 1 regla de rate limit por proyecto (3 reglas personalizadas en
   total); en Pro, hasta 40.

## 4. Otros proveedores
Resend (cuota de correo), Google Wallet API (cuotas) y Neon (solo ramas temporales de
pruebas): anotar su límite y dónde ver el consumo en `docs/BILLING_PLAN.md`.
