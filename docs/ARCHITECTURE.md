# ARCHITECTURE — SaaS Fidelización Fruppy

> Estado: propuesta Fase 0 (pendiente aprobación). Ver `DECISIONS.md` ADR-001/003.

## Visión

Monolito modular **Next.js App Router + TypeScript estricto** sobre
**Supabase** (Auth + PostgreSQL + RLS). Una sola fuente de verdad para saldos:
el ledger en Postgres. Apple/Google Wallet son espejos actualizables, nunca
autoridad.

## Diagrama de módulos

```
app/                        # Next.js routes (UI + API)
├── (auth)/                 # login, registro de comercio
├── (dashboard)/            # panel del comercio (org-scoped)
├── card/[token]/           # tarjeta web pública del cliente
└── api/
    ├── wallet/v1/          # web service de Apple (registrations/passes/log)
    └── ...

lib/
├── domain/                 # reglas puras de negocio (sin IO)
│   ├── loyalty/            # sellos, puntos, metas, canjes
│   └── ...
├── organizations/          # orgs, membresías, roles, sedes
├── customers/              # CRM
├── ledger/                 # transacciones, saldos, reversos (RPC SQL)
├── rewards/                # catálogo y redenciones
├── visits/                 # registro de visitas
├── qr/                     # tokens de tarjeta opacos y revocables
├── wallet/
│   ├── provider.ts         # interfaz WalletProvider
│   └── providers/passlet.ts
├── analytics/
├── audit/                  # audit_logs
└── supabase/               # clients server/anon, helpers de sesión

supabase/
└── migrations/             # versionadas, reproducibles desde vacío

docs/  scripts/  tests/     # documentación, tooling, pruebas
```

## Modelo de datos (del plan, §4)

`organizations` → `organization_members`(user_id, role) → `locations` →
`customers` → `loyalty_programs` → `loyalty_accounts` (+ proyección de saldo) →
`loyalty_transactions` (ledger append-only con `idempotency_key`) →
`rewards` / `redemptions` / `customer_visits` / `wallet_passes` / `audit_logs`.

Reglas: toda tabla de negocio lleva `organization_id` o cuelga de una que lo
tenga; dinero en unidades menores o `numeric`; UTC en almacenamiento.

## Integridad del saldo

- `loyalty_transactions` es append-only (REVOKE UPDATE/DELETE).
- `loyalty_accounts.current_*` es proyección actualizada **en la misma
  transacción SQL** que inserta el movimiento (RPC `security definer`).
- Canje: UPDATE condicional `balance >= cost` + fila en `redemptions`,
  todo atómico; `idempotency_key` UNIQUE evita duplicados por reintento.
- Correcciones: movimiento `reversal`/`adjustment` con
  `reference_transaction_id`. Nunca se edita el historial.
- Reconciliación: `saldo == SUM(delta)` por cuenta — chequeable con un SQL.

## Autenticación y autorización

- Supabase Auth para personal del comercio. Roles en `organization_members`:
  `owner > admin > manager > staff` (permisos crecientes).
- RLS por membresía activa; operaciones de saldo solo vía RPC con checks
  internos de rol + organización.
- Cliente final: acceso a su tarjeta por token opaco (`card_token`, ≥128 bits,
  revocable). Sin cuenta obligatoria en el MVP. El QR contiene solo el token.
- Middleware de rutas privadas; el frontend nunca es la única barrera.

## Wallet

Interfaz `WalletProvider` (`createPass`, `updatePass`, `revokePass`,
`healthCheck`). Primera implementación: **passlet** (MIT, 0 deps runtime,
Node ≥20.15). El sync es best-effort fuera de la transacción de saldo, con
reintentos idempotentes y `wallet_passes.last_sync_error_code`. Flags
`APPLE_WALLET_ENABLED`/`GOOGLE_WALLET_ENABLED` hasta tener credenciales.

## Entornos y despliegue

- `local` (Supabase CLI), `staging`, `production`. Credenciales por entorno,
  jamás compartidas. Migraciones de producción con revisión + backup previo.
- Hosting por decidir (debe soportar runtime Node completo: firmado `.pkpass`,
  APNs HTTP/2). Vercel es candidato por el ecosistema Next.js (MCP disponible).
- Observabilidad: logs estructurados sin PII ni secretos; Sentry opcional
  (`SENTRY_DSN`).

## Patrones adoptados de la auditoría (conceptos, no código)

De `digital-loyalty-cards` (MIT): UPDATE condicional para canje, push Wallet en
segundo plano, purga de tokens APNs muertos, firma HMAC de enlaces, CSV
anti-fórmula. De `starfiniti` (AGPL, solo conceptos): ledger inmutable,
compensación en vez de rewrite, deduplicación de eventos, tests adversariales
de aislamiento, dominio puro separado de IO.
