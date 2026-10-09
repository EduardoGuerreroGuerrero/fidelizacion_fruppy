# Auditoría Fase 0 — Repositorios de referencia

> Fecha: 2026-10-09 · Ejecutado en local (Windows, conda `F_FRUPPY`, Node 24.21)
> Clones en `audits/repos/` (gitignored, solo lectura para análisis).

## Metadatos (API GitHub, 2026-10-09)

| Repo | Licencia | Stars | Issues abiertos | Creado | Último push |
|---|---|---|---|---|---|
| longlivewama/digital-loyalty-cards | MIT | 0 | 0 | 2026-10-07 | 2026-10-07 |
| oscartrevio/passlet | MIT | 11 | 1 | 2026-03-31 | 2026-10-07 |
| Starfiniti/starfiniti-loyalty | AGPL-3.0 | 0 | 38 | 2026-08-11 | 2026-10-04 |
| PassKit/passkit-node-quickstart | MIT | 16 | 4 | 2021-01-12 | 2026-10-08 |

## 1. digital-loyalty-cards — candidato a base (opción A)

**Qué es:** app de tarjeta de sellos para UNA cafetería (9 sellos = café gratis).
Next.js 15 App Router + React 19 + TS + Supabase + `passkit-generator` (Apple) +
`@googleapis/walletobjects` (Google) + `qrcode` + `sharp`.

### Fortalezas verificadas en el código

- Funciones SQL atómicas: `change_points` (UPDATE con `GREATEST(0, ...)`) y
  `claim_reward` (`UPDATE ... WHERE points >= goal` → sin doble canje ni saldo
  negativo a nivel de base de datos).
- RLS activado en todas las tablas **sin ninguna policy pública**: todo el
  acceso pasa por `service_role` en rutas de servidor.
- `REVOKE EXECUTE` de las funciones de sellos para `public`/`anon`/`authenticated`.
- Enlaces de tarjeta firmados con HMAC (`?k=hmac(serial)`): el serial impreso en
  el QR no basta para descargar el pase ni su token de autenticación.
- Cookie de sesión del comercio = HMAC del PIN (el PIN nunca viaja al navegador);
  tabla `login_attempts` para bloqueo por fuerza bruta.
- Export CSV con neutralización de fórmulas de hoja de cálculo.
- Actualizaciones de Wallet en segundo plano (`after()`): Apple/Google nunca
  bloquean ni revierten la escritura en base de datos; tokens APNs muertos
  (410/400) se purgan.
- Tests con `node:test`/`tsx`: unitarios de fidelización, firma de enlaces,
  objeto/clase de Google Wallet, contenido del `.pkpass`; tests de DB aparte.

### Debilidades frente al plan (bloqueantes para opción A)

- **Single-tenant**: no existe `organization_id`, `memberships`, sedes ni roles.
  Un único `MERCHANT_PIN` compartido para todo el negocio.
- **Sin ledger**: `events` es un log aparte escrito en una segunda query no
  transaccional; no hay `idempotency_key` ni reversos.
- **Sin modelo de dominio SaaS**: no hay `customers`, `loyalty_programs`,
  `rewards`, `redemptions`, `visits`, `audit_logs`. Solo `members` + `settings`
  (fila única) + `campaigns`.
- **Dependencia vulnerable**: `passkit-generator` → `node-forge` con
  vulnerabilidad ALTA sin fix (GHSA-86w9-cpqp-85rv, verificación de firma
  RSA PKCS#1 v1.5). `npm audit`: 2 high severity.
- Serial de tarjeta corto (8 hex = 32 bits); aceptable solo porque el HMAC `k`
  protege las descargas.
- Solo programa de sellos fijo (goal en `settings`); no hay puntos ni
  multi-programa.
- Repo muy joven (2 días), 0 stars, un solo autor, sin historial de issues.

### Verificaciones locales ejecutadas

| Comando | Resultado |
|---|---|
| `npm ci` | OK, 138 paquetes |
| `npm run typecheck` (`tsc --noEmit`) | OK, sin errores |
| `npm test` (unitarios) | 22/23 OK; 1 fallo: firma `.pkpass` real requiere `openssl`/`dev-certs.sh` (limitación Windows, no del código) |
| `npm audit` | 2 vulnerabilidades altas (`node-forge` vía `passkit-generator`), sin fix |
| Tests de DB (`test:db`) | No ejecutados: requieren Supabase local levantado |

## 2. passlet — biblioteca Wallet candidata

**Qué es:** biblioteca TS que emite y actualiza pases de Apple y Google con una
sola definición (`Wallet.loyalty()` → `.pkpass` firmado + save link JWT).

- **Licencia MIT**, paquete publicado en npm, versión actual **3.2.0**.
- **Cero dependencias runtime** (zod/mini empaquetado en build) — contrasta con
  la cadena `passkit-generator` → `node-forge` vulnerable.
- Node ≥ 20.15. API: `create`, `createBundle`, `update` (con APNs persistente y
  `notify` en Google vía AddMessage), `publish`, `expire`, `sendMessage`,
  `apple.webService` para los endpoints de actualización de Apple,
  `registrations.updatablePasses` para polls eficientes.
- `WalletError.results` (`PlatformResults`) expone el resultado por plataforma
  cuando una falla y la otra no — ideal para `wallet_passes.last_sync_error`.
- Mantenimiento activo: changelog detallado con correcciones de casos reales
  (conflictos concurrentes de clase, tokens Google cacheados, timeouts de
  descarga de imágenes, iOS <18 `relevantDate`).
- e2e propios contra servicios reales (`test:e2e` con credenciales).
- Evaluación: **madura y recomendable** como implementación detrás de nuestra
  interfaz `WalletProvider`. No acoplar el dominio a su API.

## 3. starfiniti-loyalty — solo referencia arquitectónica

- **AGPL-3.0-or-later** confirmada (conector WooCommerce GPL-2.0). Copyleft
  fuerte: **prohibido copiar código** a un producto propietario/SaaS sin
  liberarlo. Solo se documentan conceptos.
- Arquitectura seria y muy relevante como patrón (monorepo: `packages/domain`
  con reglas puras, `packages/contracts` con esquemas versionados, migraciones
  `tenancy_foundation`, `immutable_ledger_foundation`, `programme_engine`).
- Invariantes documentados que adoptamos como PRINCIPIOS (no código):
  ledger inmutable y atribuible, correcciones por compensación, eventos con
  deduplicación "exactly one business effect", RLS + tests adversariales de
  aislamiento, pgTAP, nunca exponer service_role, no fusionar clientes por
  email, no loguear datos personales.
- 38 issues abiertos: proyecto en construcción, no referencia de estabilidad.

## 4. passkit-node-quickstart — referencia de proveedor (opción C)

- MIT, ejemplos oficiales del SDK `passkit-node-sdk` (gRPC).
- Requiere **cuenta PassKit de pago** + credenciales (certificate.pem, key.pem,
  ca-chain.pem). Es un servicio gestionado que abstrae certificados Apple,
  APNs y la API de Google.
- No resuelve CRM, fidelización ni multi-tenancy: solo la emisión de pases.

## Conclusión de la auditoría

Ver `docs/DECISIONS.md` (ADR-001). Recomendación: **opción B** — proyecto limpio
con `passlet` detrás de una interfaz propia; `digital-loyalty-cards` queda como
referencia documentada de patrones (web service de Apple, push APNs, firma de
enlaces), no como base de código.
