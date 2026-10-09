# ROADMAP — SaaS Fidelización Fruppy

> Seguimiento operativo en `CHECKLIST.md` (auto-actualizable con
> `scripts/checklist.py`). Este documento resume estado, criterios de salida y
> bloqueos por fase.

## Estado actual

| Fase | Estado | Notas |
|---|---|---|
| SETUP | ✅ Completo | Workspace DevOps + checklist automático + git |
| F0 Auditoría | ✅ Aprobada | Opción B (proyecto limpio + passlet) aprobada por el usuario |
| F1 Base proyecto | ✅ Completo | Next.js 16 en `apps/web` (workspaces), migración 0001 verificada en Postgres real (Neon, rama temporal), CI lint/typecheck/test/build/audit + job SQL. Pendiente: protección de `main` requiere remote GitHub; Supabase local requiere Docker (ausente) |
| F2 Identidad/aislamiento | ✅ Completo | Supabase Auth (login/signup/logout), proxy.ts, dashboard con check real, creación de org + owner, migración 0002 con policies RLS **verificadas adversarialmente en Postgres real** (usuario A no ve ni toca B; ledger rechaza INSERT directo) |
| F3 CRM básico | ✅ Completo | `/dashboard/[org]/customers`: listado+búsqueda+filtros, alta/edición con validación server-side, ficha con historial cronológico (visitas+ledger+redenciones), aviso de duplicados sin fusión automática, export CSV con anti-formula-injection + auditoría, consentimiento como evento separado. Data-paths verificados en Postgres real (insert/update/select/consent/dup/or-isolation) |
| F4 Motor fidelización | ✅ Completo | Migraciones 0002/0003: `earn`/`redeem_reward`/`reverse_transaction`/`record_visit` security-definer, ledger append-only, idempotencia por org, saldo proyectado en la misma tx. **21/21 pruebas en Postgres real** (`scripts/test_engine.py`): idempotencia, doble canje secuencial y **concurrente** (2 hilos, 1 gana), reversos, negativos bloqueados, aislamiento RLS, reconciliación saldo=Σledger |
| F5 QR/empleado | ✅ Completo | Tokens revocables/rotables por tarjeta, `/t/[token]` público, escaneo + visita + earn/redeem por empleado, rate limit en DB. 11/11 en Postgres real |
| F6 Wallet | ✅ Completo | `WalletProvider` + adapter passlet (API real inspeccionada), sync `wallet_passes`, tarjeta web con branding. 7/7 tests |
| F7 Dashboard/config | ✅ Completo | Migración 0005: `organizations.brand` + `organization_invites` + `claim_invites`. Páginas: inicio con métricas, programas, recompensas, equipo (invitaciones+roles), sedes, configuración con vista previa de tarjeta, auditoría. 12/12 en Postgres real (`scripts/test_admin.py`) |
| F8–F9 | ⬜ Pendientes | Según plan |
| F10 Comercial | ⬜ No iniciar hasta MVP validado | |

## Hitos

1. **F0 — Auditoría** ✅: licencias verificadas (MIT ×3, AGPL ×1 referencia),
   vulnerabilidad alta detectada en `passkit-generator`→`node-forge`,
   recomendación: proyecto limpio + `passlet`.
2. **F1 — Scaffolding**: Next.js + Supabase local + CI + migraciones desde cero.
   Salida: instalación reproducible, CI verde, cero secretos versionados.
3. **F2 — Multi-tenancy**: Auth + orgs + RLS + tests negativos de aislamiento.
   Salida: usuario A no puede tocar nada de B, ni por API directa.
4. **F4 — Motor loyalty** ✅: funciones RPC transaccionales verificadas en
   Postgres real (earn/redeem/reverse/visit, idempotencia, concurrencia).
   Herramientas: `scripts/db_apply.py` (runner de migraciones a cualquier
   Postgres) + `scripts/test_engine.py` (suite adversarial reutilizable).
5. **F3–F5 — CRM + QR**: CRUD con autorización, tokens de tarjeta revocables,
   flujo de empleado.
6. **F6 — Wallet**: `WalletProvider` + passlet; tarjeta web siempre disponible;
   Apple/Google solo con credenciales reales.
7. **F7–F8 — Dashboard + analítica**: métricas reales reconciliables.
8. **F9 — Piloto**: 1–2 comercios, datos de prueba → reales con consentimiento;
   backups/restauración verificados.
9. **F10 — Comercial**: suscripciones, campañas, importación — solo tras piloto.

## Puertas (no avanzar si…)

- F0→F1: sin aprobación del usuario de la opción técnica.
- →F2: sin aislamiento multi-tenant garantizado.
- →F4: sin entender cómo se protege el saldo.
- →F9: con bugs críticos de aislamiento/saldo, o sin backups probados.
- Cualquier fase: con fallos críticos de seguridad o integridad de datos.

## Riesgos abiertos

- Credenciales Apple Developer (de pago) y Google Wallet issuer para Fase 6 —
  mitigación: tarjeta web como fallback siempre disponible.
- Revisión legal Ley 1581/2012 antes de datos reales.
- Hosting con runtime Node completo para APNs/`.pkpass` — validar en Fase 1.
