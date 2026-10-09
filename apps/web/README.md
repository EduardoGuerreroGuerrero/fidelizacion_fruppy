# apps/web — aplicación Next.js

Aplicación principal del SaaS Fruppy (Next.js 16 App Router + TypeScript
estricto + Tailwind v4 + Supabase).

## Comandos (desde la raíz del repo)

```bash
npm run dev         # desarrollo (Turbopack)
npm run build       # build de producción
npm run lint        # eslint
npm run typecheck   # next typegen + tsc --noEmit
npm run test        # tests unitarios (tsx --test)
npm run check       # lint + typecheck + test + build
```

## Variables de entorno

Crear `apps/web/.env.local` desde `../../.env.example` (plantilla canónica en
la raíz del repo). Las `NEXT_PUBLIC_*` son las únicas que llegan al navegador.

## Notas de esta versión de Next.js (16.x)

- `cacheComponents: true` está activo: los Route Handlers **no se cachean por
  defecto** y `export const dynamic` es incompatible en varios contextos.
- `error.tsx` recibe `retry` (no `reset`).
- `LayoutProps`/`PageProps` son tipos generados por `next typegen` (incluido
  en `npm run typecheck`).
- Los params de rutas dinámicas son `Promise<...>` (usar `await params`).

## Estructura relevante

```
app/api/health/route.ts   # endpoint de salud público (no sensible)
app/error.tsx             # boundary de error
app/not-found.tsx         # 404
lib/env.ts                # acceso validado a variables de entorno
lib/supabase/client.ts    # cliente browser (anon key + RLS)
lib/supabase/server.ts    # cliente server (sesión) + supabaseAdmin (service_role)
tests/                    # tests unitarios (node:test via tsx)
```

## Deploy (Vercel)

- Proyecto `fidelizacion-fruppy` enlazado a `main` de
  `EduardoGuerreroGuerrero/fidelizacion_fruppy`.
- **Root Directory: `apps/web`** — obligatorio: el monorepo usa npm
  workspaces; sin esta opción el build genera `.next` dentro de `apps/web`
  pero Vercel busca el output en la raíz y despliega un sitio vacío (404 en
  todas las rutas aunque el build aparezca verde).
- Vercel omite ("skips") deploys de commits que no tocan `apps/web`.
- Variables requeridas en Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
