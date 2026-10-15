# Auditoría — Autorregistro por QR, Wallet y notificaciones por comercio

> Fase 0 del plan `plan_implementacion_qr_notificaciones_saas.md`.
> Fecha: 2026-10-14 · Rama: `feat/qr-self-registration`

## 1. Estado actual (baseline de pruebas)

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (1 warning preexistente en `lib/wallet/passlet.ts`) |
| `npm run typecheck` | OK |
| `npm run test` | 7/7 tests (env, wallet) |
| `npm run build` | OK en CI (se verifica de nuevo al final) |
| SQL E2E (`supabase/tests/e2e_loyalty.sql`) | Se valida en job `sql` de CI / rama Neon |

## 2. Esquema real de tenants

- `organizations` (name, slug único, status trial/active/suspended, timezone,
  currency, `brand` jsonb).
- `organization_members` (user_id → auth.users, role owner/admin/manager/staff,
  status). Roles: `owner > admin > manager > staff`.
- Aislamiento: `organization_id` en todas las tablas + RLS ON en todo.
  Helpers `current_user_org_ids()` y `current_user_has_role()` (security
  definer, search_path fijado). Tests negativos cross-org ya existen.
- Cliente final SIN cuenta: acceso a su tarjeta por `customer_cards.token`
  (128 bits hex, revocable, rotable). El token ES la credencial.

## 3. Flujo actual vs. flujo objetivo

### Actual (alta por administrador)

```
staff → /dashboard/{org}/customers/new → createCustomer()
      → issue_card RPC → customer_cards.token
      → correo (Resend, sendCardEmail) con link /t/{token}
      → cliente escanea SU QR en caja → scan_card (staff autenticado)
      → consentimiento: /t/{token}/consent → record_card_consent
```

El QR actual identifica **una tarjeta ya creada**; no existe QR "del local"
para que un desconocido se registre solo. No hay `/join`.

### Objetivo (autorregistro)

```
QR impreso en el local → /join/{join_token}
      → resolve_join() valida org activa + programa vigente (servidor)
      → formulario mínimo (nombre + email; teléfono opcional)
      → register_customer_via_join() atómico:
          cliente (dedupe email/org) + consentimientos + cuenta + tarjeta
      → correo de bienvenida vía outbox (best-effort, no bloquea)
      → /t/{card_token} con acciones opcionales: push, ubicación, Wallet
```

## 4. Componentes reutilizables (NO duplicar)

| Necesidad | Existente | Reuso |
|---|---|---|
| Tarjeta opaca revocable | `customer_cards` + `/t/{token}` + `issue_card` | La RPC de join crea cuenta+tarjeta igual que `issue_card` (misma lógica inline, sin rol staff) |
| Proyección pública | `get_card_app_data` | Extender con preferencias de consentimiento |
| Consentimiento | `record_card_consent`, `data_consent_at`, `marketing_consent_at` | Se mantiene como proyección rápida; se añade `customer_consents` como registro auditable por finalidad |
| Correo | Resend vía fetch en `sendCardEmail` | Extraer a `lib/email/` (adaptador + outbox); `sendCardEmail` migra al adaptador |
| Wallet | `lib/wallet/*` (passlet), `wallet_passes`, rutas `/wallet/{google,apple}` | Sin cambios estructurales |
| Auditoría | `audit_logs` + `write_audit_log` | Reusar para eventos de staff |
| Rate limit | patrón `scan_card` (count en ventana) | Mismo patrón con tabla `join_attempts` |
| Idempotencia | `idempotency_key` UNIQUE + ON CONFLICT | Mismo patrón en join/email/push |
| RLS helpers | `current_user_has_role` | Policies de tablas nuevas |

## 5. Qué NO existe y hay que crear

1. Token público de join por org (`/join/{token}`, revocable/rotable).
2. `customer_consents` — eventos por finalidad/canal con versión de texto.
3. `push_subscriptions` — endpoint+claves por (org, endpoint); estado.
4. `push_campaigns` + `push_deliveries` — campañas por comercio, cola y métricas.
5. `email_outbox` — cola transaccional idempotente.
6. `data_rights_requests` — solicitudes de titulares (acceso/rectificación/supresión).
7. Web Push: claves VAPID, `public/sw.js` (no existe SW — nada que pisar),
   suscripción por dispositivo + autorización comercial por comercio.
8. Centro de preferencias real: `perfil/notificaciones` hoy usa localStorage
   (mock) → pasa a DB vía RPCs públicas por token de tarjeta.
9. Config legal por org (responsable, email privacidad, URL política,
   versión de textos) — `organizations.legal` jsonb + formulario en settings.
10. Límites por plan — `organizations.limits` jsonb (campañas/mes, suscriptores).
11. Feature flags — `organizations.features` jsonb (join, push, wallet, geo).
12. Ubicación opcional: `locations.lat/lng` (nullable) + ordenamiento
    client-side en `/t/{token}/sedes`. Sin persistencia de coordenadas.

## 6. Matriz de roles

| Actor | Acceso | Mecanismo |
|---|---|---|
| Cliente final | Su tarjeta, sus consentimientos, su suscripción push | `customer_cards.token` en RPCs públicas acotadas |
| Staff | Registrar visitas/escaneos, crear clientes | RPCs con `current_user_has_role(staff+)` |
| Manager | + campañas, sedes, equipo | role manager+ en RLS/RPC |
| Admin/Owner | + programas, recompensas, config, join QR, auditoría | role admin+ |
| Plataforma (service_role) | outbox, push send, wallet sync | `supabaseAdmin()` solo en servidor |

## 7. Migraciones planeadas

- `0011_join_and_consents.sql`: `organizations.join_token` + `legal` +
  `features` + `limits`, `customer_consents`, `join_attempts`,
  `locations.lat/lng`, RPCs `resolve_join`, `register_customer_via_join`,
  `rotate_join_token`, `set_card_consent`, `get_card_consents`,
  índice único `(organization_id, lower(email))` en customers.
- `0012_push_campaigns_outbox.sql`: `push_subscriptions`, `push_campaigns`,
  `push_deliveries`, `email_outbox`, `data_rights_requests`, RPCs
  `upsert_push_subscription`, `revoke_push_subscription`,
  `create_push_campaign`, `queue_push_campaign`, `campaign_audience_count`,
  `submit_rights_request`, elegibilidad en envío (consent vigente).

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Enumeración de clientes por email en /join | Si el email ya existe → respuesta neutra "te enviamos tu tarjeta por correo", nunca el token |
| Spam por formulario público | Honeypot + rate limit por (org, hash IP+UA) + validación servidor |
| service_role en cliente | Solo `supabaseAdmin()` en server actions/routes; anon RPCs acotadas |
| Suscripción push única por origen vs. varios comercios | Fila por (organization_id, endpoint); consentimiento por comercio en DB; un solo SW |
| Baja antes de envío programado | Elegibilidad re-evaluada en el momento del envío (consent vigente) |
| `web-push` nueva dependencia | v3.6.7 (>1 año publicada), estándar de facto; tests unitarios de payload |

## 9. Variables de entorno nuevas (solo nombres)

`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
`CRON_SECRET` (drenar outbox/cola push), `PUSH_ENABLED`.

## 10. Decisión sobre el QR público

`/join/{join_token}` con token aleatorio por org (en `organizations`),
NO el slug: el token es revocable/rotable ante abuso sin cambiar el slug.
Estado de la org se exige `active` o `trial` en `resolve_join`.
