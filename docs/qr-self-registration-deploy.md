# Despliegue — Autorregistro QR, consentimientos, push y campañas

Guía operativa de la funcionalidad implementada en `feat/qr-self-registration`.
Nada de este documento contiene secretos; los valores reales solo van en el
gestor de variables del entorno (Vercel/Supabase).

## 1. Migraciones

Aplicar en orden sobre el proyecto Supabase (staging primero):

- `20261014000011_join_and_consents.sql` — join token, consentimientos
  auditables, flags/legales/límites por comercio, lat/lng de sedes, RPCs
  públicas (`resolve_join`, `register_customer_via_join`,
  `get_card_consents`, `set_card_consent`, `admin_set_customer_consent`).
- `20261014000012_push_campaigns_outbox.sql` — `push_subscriptions`,
  `push_campaigns`, `push_deliveries`, `email_outbox`,
  `data_rights_requests` y RPCs de campaña/derechos.

Ambas son aditivas (no alteran ni borran datos existentes). Las columnas
nuevas tienen defaults; `join_token` se genera automáticamente para las
organizaciones existentes.

Verificación sin Docker: `NEON_DSN=… python scripts/run_e2e_neon.py`
(replica el job `sql` de CI: stub auth + migraciones + tests en una rama
temporal de Neon).

## 2. Variables de entorno nuevas

| Variable | Público | Uso |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Sí | Clave pública VAPID para `pushManager.subscribe`. |
| `VAPID_PRIVATE_KEY` | No (solo servidor) | Firma de envíos Web Push. |
| `VAPID_SUBJECT` | No | `mailto:` de contacto exigido por Web Push. |
| `PUSH_ENABLED` | No | Kill-switch global de envíos (`false` desactiva). |
| `CRON_SECRET` | No | Bearer que protege `GET /api/cron/drain`. |

Generar el par VAPID una vez: `npx web-push generate-vapid-keys`.

## 3. Cron de colas

`apps/web/vercel.json` programa `GET /api/cron/drain` a diario (13:00 UTC).
Vercel envía `Authorization: Bearer $CRON_SECRET` automáticamente cuando la
variable existe. NOTA: el plan Hobby solo permite crons diarios — con plan
Pro se puede subir a `*/10 * * * *` para drenar la cola cada 10 min, o usar
un scheduler externo (GitHub Actions, pg_cron) que haga GET con el Bearer.
El cron:

- Drena `email_outbox` (bienvenida y reentrega de tarjeta; máx. 5 intentos).
- Procesa `push_deliveries` (lotes de 50, 1 reintento, baja de endpoints
  muertos en 404/410, re-chequeo de consentimiento en el envío).

Sin cron activo los correos de bienvenida siguen intentándose en el momento
del registro (best-effort) — el cron es la red de recuperación.

## 4. Feature flags por comercio

En `organizations.features` (editables desde Configuración → Privacidad y
funciones):

| Flag | Default | Efecto |
|---|---|---|
| `self_registration` | `true` | `/join/{token}` acepta altas. |
| `push` | `false` | Activa suscripción push y campañas del comercio. |
| `location` | `false` | Muestra "sedes cercanas" en la tarjeta. |
| `wallet` | `true` | Botones Wallet en la tarjeta (además requieren credenciales). |

En `organizations.legal`: `data_controller`, `privacy_email`, `policy_url`,
`consent_version` (se sella en cada evento de consentimiento).

En `organizations.limits`: `push_campaigns_per_month` (def. 30) y
`push_max_subscribers` (def. 5000).

## 5. Activación gradual recomendada

1. Migraciones + despliegue de código con todo desactivado (flags por
   defecto: solo autorregistro).
2. Verificar `/join/{token}` con un comercio piloto: alta → tarjeta →
   correo de bienvenida (requiere `RESEND_API_KEY` + `EMAIL_FROM`).
3. Generar VAPID y activar `push` en el comercio piloto; probar
   suscripción y una campaña.
4. Configurar `legal` por comercio antes de abrir a producción real.
5. Ubicación: solo comercios con sedes que tengan lat/lng cargadas.

## 6. Rollback

- Código: revert del merge; las migraciones son aditivas y no rompen la
  versión anterior (las tablas/columnas nuevas se ignoran).
- Funcional: apagar `features.*` del comercio o `PUSH_ENABLED=false`
  detiene el flujo sin despliegue.
- Datos: si hubiera que eliminar el esquema nuevo, las tablas creadas son
  independientes (`drop table` explícito; nada automático).

## 7. Notas de seguridad

- `push_subscriptions`: los miembros del comercio ven estado/conteo, pero
  NO `endpoint`/`p256dh`/`auth` (grant a nivel de columna; solo
  `service_role` los lee para el envío).
- `customer_consents` es append-only vía API: miembros solo leen; la
  evidencia la escriben las RPCs definer.
- El QR de join es `join_token` (128 bits, rotable en dashboard por
  owner/admin); no contiene PII ni el id de la organización.
- El correo de "tarjeta ya registrada" va al email en archivo y la página
  de respuesta es neutra — no permite enumerar registros.
