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
| F3 CRM básico | ⬜ Siguiente | CRUD clientes, historial, duplicados, CSV |
| F4–F9 | ⬜ Pendientes | Según plan |
| F10 Comercial | ⬜ No iniciar hasta MVP validado | |

## Hitos

1. **F0 — Auditoría** ✅: licencias verificadas (MIT ×3, AGPL ×1 referencia),
   vulnerabilidad alta detectada en `passkit-generator`→`node-forge`,
   recomendación: proyecto limpio + `passlet`.
2. **F1 — Scaffolding**: Next.js + Supabase local + CI + migraciones desde cero.
   Salida: instalación reproducible, CI verde, cero secretos versionados.
3. **F2 — Multi-tenancy**: Auth + orgs + RLS + tests negativos de aislamiento.
   Salida: usuario A no puede tocar nada de B, ni por API directa.
4. **F3–F5 — CRM + loyalty + QR**: CRUD con autorización, ledger atómico con
   idempotencia, tokens de tarjeta revocables, flujo de empleado.
5. **F6 — Wallet**: `WalletProvider` + passlet; tarjeta web siempre disponible;
   Apple/Google solo con credenciales reales.
6. **F7–F8 — Dashboard + analítica**: métricas reales reconciliables.
7. **F9 — Piloto**: 1–2 comercios, datos de prueba → reales con consentimiento;
   backups/restauración verificados.
8. **F10 — Comercial**: suscripciones, campañas, importación — solo tras piloto.

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
