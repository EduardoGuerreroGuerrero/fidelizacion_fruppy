# AGENTS.md — Fidelización Fruppy

Reglas y contexto persistente del proyecto para agentes.

## Documento rector

`plan_saas_fidelizacion_crm_wallet.md` — 12 reglas obligatorias (multi-tenancy
desde el inicio, ledger inmutable, operaciones atómicas, servidor como frontera
de confianza, no exponer secretos, pruebas obligatorias). Decisiones en
`docs/DECISIONS.md`, threat model en `docs/SECURITY.md`.

## Entorno

- Conda env `F_FRUPPY` (Python 3.11) para tooling: `scripts/checklist.py`.
  Si `conda` no está en PATH: `C:/Users/Acer/anaconda3/envs/F_FRUPPY/python.exe`.
- App en `apps/web`: Next.js 16 + TS estricto + Tailwind v4 + Supabase.
  npm workspaces en raíz — `npm install` en raíz, node_modules hoisted.
- Docker NO está instalado → `supabase start` no funciona en local. Las
  migraciones se validan sobre Postgres real vía Neon MCP (rama temporal) o
  el job `sql` de CI (postgres:16 + stub de `auth.users`).

## Comandos de verificación

```bash
npm run lint && npm run typecheck && npm run test && npm run build   # raíz
python scripts/checklist.py status                                    # progreso
ruff check scripts/                                                   # lint Python
```

## Gotchas conocidos

- Next 16 + `cacheComponents`: Route Handlers no se cachean por defecto;
  `export const dynamic` incompatible en varios contextos. `error.tsx` usa
  `retry` (no `reset`). `LayoutProps`/`PageProps` los genera `next typegen`.
- `NEXT_PUBLIC_*` solo se inlinea en el bundle con acceso estático
  (`process.env.NEXT_PUBLIC_X`), nunca dinámico `process.env[name]`.
- `npm audit` marca `braces` (dev-only, cadena eslint-config-next → fast-glob):
  no hay versión con fix (3.0.3 es la última). Riesgo aceptado: no llega a
  producción. Audit de prod: `npm audit --omit=dev`.
- Supabase MCP: server `supabase-mcp-server` disponible. Neon MCP: proyecto
  `fruppy-agentkit` (usar solo ramas temporales para pruebas).

## Checklist

`CHECKLIST.md` se actualiza SOLO vía `scripts/checklist.py`
(`done|doing|undone|blocked <ID>`). Nunca editar el bloque PROGRESS a mano.
Marcar tareas al completarlas — el bloque de progreso se regenera solo.
