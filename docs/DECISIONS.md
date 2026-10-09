# DECISIONS — Registro de decisiones técnicas (ADR)

> Formato: una entrada por decisión, con contexto, opciones, decisión,
> consecuencias e implicaciones de reversión. No borrar entradas: si una
> decisión se revoca, se añade una nueva que la referencia.

## ADR-001 — Base técnica: proyecto limpio (opción B)

**Fecha:** 2026-10-09 · **Estado:** propuesta (pendiente aprobación del usuario)

### Contexto

El plan exige comparar tres opciones para la base del SaaS (detalle de la
auditoría en `docs/audits/fase0-repositorios.md`).

### Matriz de decisión

| Criterio | A. Extender `digital-loyalty-cards` | B. Proyecto limpio + libs compatibles | C. PassKit como proveedor |
|---|---|---|---|
| Licencia | MIT (compatible comercial, conservar aviso si se reutiliza código) | Sin restricciones; deps MIT | MIT ejemplos; servicio de pago |
| Multi-tenancy | Inexistente: habría que reescribir modelo, auth (PIN único) y cada query | Diseñado desde el inicio con `organization_id` + RLS | No lo aporta; hay que construir todo igual |
| Ledger auditable | No existe (solo `events` no transaccional) | Diseño propio con transacciones SQL | No lo aporta |
| Roles/staff | No (PIN único por negocio) | Supabase Auth + memberships + roles | No lo aporta |
| Wallet | Funciona, pero `passkit-generator`→`node-forge` vuln alta sin fix | `passlet` v3.2.0 (MIT, 0 deps runtime, API unificada, mantenida) | PassKit lo abstrae por completo (sin certificados propios) |
| Tiempo de entrega | Falso atajo: se reescribe el 80% del núcleo | Mayor control, coste inicial de scaffolding | Wallet más rápido, resto igual + integración SDK |
| Coste operativo | Hosting propio | Hosting propio | Suscripción PassKit recurrente por pase |
| Riesgo | Repo de 2 días, 0 stars, un autor, sin adopción | Bajo: stack estándar, patrones verificados | Dependencia comercial externa; lock-in de pases |
| Mantenibilidad | Cargar con decisiones single-tenant | Monolito modular limpio | Bien para Wallet; el resto igual |

### Decisión propuesta

**Opción B**: crear aplicación limpia (Next.js App Router + TypeScript estricto +
Supabase) reutilizando solo componentes compatibles:

- `passlet` detrás de una interfaz propia `WalletProvider`
  (`createPass/updatePass/revokePass/healthCheck`). Si mañana conviene PassKit
  (opción C), se implementa un segundo adaptador sin tocar el dominio.
- `digital-loyalty-cards` se conserva como **referencia de patrones**
  (documentados en la auditoría): endpoints del web service de Apple, push APNs,
  firma HMAC de enlaces de tarjeta, funciones SQL atómicas. No se copia código;
  si en algún momento se reutiliza un fragmento, se mantiene el aviso MIT.

### Consecuencias

- Hay que construir el modelo multi-tenant desde cero (es lo que el plan exige
  de todos modos).
- Apple Wallet requiere cuenta Apple Developer de pago para certificados reales;
  Google Wallet requiere issuer aprobado. Hasta entonces, tarjeta web funcional.
- Reversión: la interfaz `WalletProvider` permite migrar a PassKit sin reescribir
  el dominio.

## ADR-002 — Wallet detrás de interfaz propia

**Fecha:** 2026-10-09 · **Estado:** propuesta

`WalletProvider` define el contrato del dominio; `passlet` (primera
implementación) queda confinada en `lib/wallet/providers/passlet.ts`.
Estado de sincronización en `wallet_passes` separado del ledger. Los fallos de
Wallet nunca revierten puntos ni canjes; se reintentan de forma idempotente.

## ADR-003 — Stack base

**Fecha:** 2026-10-09 · **Estado:** propuesta

Next.js App Router + TypeScript estricto + Supabase (Auth, PostgreSQL, RLS) +
Tailwind. Monolito modular. Sin microservicios, Redis ni colas externas hasta
necesidad demostrada (regla 9 del plan). Importes en unidades menores
(`amount_minor` int) o `numeric`, nunca `float`. Fechas en UTC.

## Pendientes de decisión (Fase 1+)

- Biblioteca de componentes UI accesible (evaluar tras scaffolding).
- Hosting (Vercel u otro con runtime Node completo para `.pkpass`/APNs).
- Apple Developer + Google Wallet issuer: credenciales reales para Fase 6.
