# Plan de rendimiento — latencia de clics y navegación

Fecha: 2026-10-27 · Rama: `perf/latencia-clicks`

## Síntoma

Al hacer clic en un botón o enlace del panel la acción se ejecuta, pero la
interfaz tarda en reaccionar: durante uno o varios segundos no cambia nada y
parece que el clic no se registró.

## Diagnóstico

La lentitud venía de dos problemas que se suman: **latencia real** (cada clic
encadenaba muchas idas y vueltas de red entre continentes) y **falta de
feedback** (la página no mostraba nada mientras tanto).

### 1. Servidor y base de datos en continentes distintos (causa principal)

| Componente | Región |
|---|---|
| Supabase (Postgres + Auth) | `sa-east-1` — São Paulo |
| Funciones de Vercel | `iad1` — Washington D.C. (valor por defecto, `vercel.json` no fijaba región) |

Cada consulta a Supabase desde una función de Vercel cruzaba ~7.500 km:
**~110–130 ms por ida y vuelta**. Con unas 10–14 consultas **secuenciales**
por clic, eso sumaba 1,5–2 s solo en red, antes de contar el cómputo.

### 2. Cascada de consultas secuenciales por cada clic

Ejemplo: registrar una visita (`scanCard`) y volver a `/scan`.

| # | Paso | Dónde |
|---|---|---|
| 1 | `auth.getUser()` (red → Supabase Auth) | `proxy.ts` (en **cada** petición) |
| 2 | `auth.getUser()` | `requireMembership` de la action |
| 3 | `organizations` por slug | `requireMembership` |
| 4 | `organization_members` | `requireMembership` |
| 5 | RPC `scan_card` | action |
| 6 | `customer_cards` por token | action (solo para el push de Wallet) |
| 7 | `wallet_passes` + llamada a la API de Google Wallet | `pushWalletUpdate` (bloqueaba el redirect) |
| 8 | `auth.getUser()` | `app/dashboard/layout.tsx` |
| 9 | RPC `claim_invites` (en **cada** render del panel) | `app/dashboard/layout.tsx` |
| 10 | `auth.getUser()` | `app/dashboard/[org]/layout.tsx` |
| 11 | `organization_members` + org | `app/dashboard/[org]/layout.tsx` |
| 12 | `auth.getUser()` | página `scan` |
| 13–14 | org por slug + programas | página `scan` |

`auth.getUser()` se llamaba **4 veces** por clic (proxy, action, dos layouts y
la página), y cada llamada es una petición HTTP a Supabase Auth.

### 3. Navegaciones sin feedback

- Todos los segmentos exportan `instant = false` y **no existía ningún
  `loading.tsx`**. Con `cacheComponents`, una navegación a una ruta que
  bloquea no muestra nada hasta que el servidor termina todo el render: el
  usuario se queda mirando la página anterior.
- Los enlaces del menú no tenían estado "pendiente".
- El botón **Registrar visita**, los botones **Salir** y el buscador de
  clientes eran `<button type="submit">` planos: no se deshabilitaban ni
  mostraban "Procesando…" (invitaba a hacer doble clic).
- El buscador de clientes era un `<form>` GET HTML: cada búsqueda **recargaba
  el documento completo** (JS, hidratación, proxy, layouts).

### 4. Hallazgos de base de datos (advisor de Supabase)

- 24 claves foráneas sin índice (p. ej. `customer_cards.customer_id`,
  `loyalty_accounts.customer_id`, `redemptions.*`, `wallet_passes.*`).
- Policy `visits_insert` de `customer_visits` reevalúa `auth.uid()` por fila
  (`auth_rls_initplan`).
- Índices sin uso: `customers_org_phone_idx`, `customers_org_email_idx`.

Con el volumen actual de datos estos puntos aún no son el cuello de botella,
pero sí lo serán al crecer.

## Cambios aplicados en este PR

| # | Cambio | Archivos | Impacto esperado |
|---|---|---|---|
| 1 | Funciones de Vercel en **`gru1` (São Paulo)**, la misma región que Supabase | `apps/web/vercel.json` | ~110 ms → ~2–5 ms por consulta. Es el cambio de mayor impacto. |
| 2 | `getAuthUser()` con `React.cache()`: layouts, página y helpers del mismo render comparten **una** llamada a `auth.getUser()` | `lib/supabase/server.ts` + 27 archivos | 3 llamadas a Auth menos por render del panel |
| 3 | Proxy con `auth.getClaims()`: verifica el JWT localmente (ES256 + JWKS en caché) en lugar de llamar a Supabase Auth en cada petición. Sigue refrescando la sesión; la autorización real continúa en layouts, actions y RLS | `proxy.ts` | 1 llamada de red menos en **cada** petición |
| 4 | `claim_invites` sale del layout raíz del panel: corre en `/dashboard` (selector de organizaciones) y en el layout del org **solo si** el usuario aún no es miembro | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/[org]/layout.tsx` | 1 RPC menos en cada clic |
| 5 | `requireMembership`: org + membresía en **una** consulta (join por slug) | `lib/{admin,customers,loyalty}/actions.ts` | 1 consulta menos por action |
| 6 | Push a Google Wallet con `after()`: se ejecuta después de responder, sin retrasar el redirect | `lib/loyalty/actions.ts`, `lib/customers/actions.ts` | Elimina la latencia de la API de Google (0,3–1,5 s) en escanear, canjear, revocar, reemitir y rotar |
| 7 | `loading.tsx` con skeleton en `/dashboard`, `/dashboard/[org]/*` y `/t/[token]/*` | 3 archivos nuevos | Feedback visual **inmediato** al navegar |
| 8 | Spinner en los enlaces del menú del panel y en la barra de tabs del cliente (`useLinkStatus`) | `app/_components/link-pending.tsx`, `nav.tsx`, `tab-bar.tsx` | El clic se nota al instante |
| 9 | `SubmitButton` (deshabilitado + texto "Registrando…/Buscando…/Saliendo…") en Registrar visita, Buscar y Salir | `scan-form.tsx`, `customers/page.tsx`, layouts | Sin doble clic; feedback inmediato |
| 10 | Buscador de clientes con `next/form`: navegación del lado del cliente en lugar de recargar el documento | `customers/page.tsx` | Búsquedas mucho más rápidas |

**Resultado estimado en "Registrar visita":** de ~14 idas y vueltas
transcontinentales más la llamada a Google Wallet (≈2–3 s) a ~9 consultas
intrarregión (≈100–250 ms), con feedback visual desde el primer milisegundo.

### Seguridad

- No cambia ningún control de autorización: el proxy sigue siendo un chequeo
  optimista; layouts, pages y actions siguen validando con `getUser()`
  contra Supabase Auth, y RLS sigue siendo la frontera real.
- `getClaims()` valida la firma ES256 del JWT. Una sesión revocada en el
  servidor sigue siendo rechazada en layouts, actions y RLS.
- La revocación de tarjetas al archivar un cliente **se sigue esperando**
  antes de responder; solo el push a Wallet se difiere.

## Pendiente (siguientes PRs)

### Fase 2 — menos consultas por página (impacto medio, esfuerzo bajo)

- [ ] Helper `getOrgContext(slug)` con `React.cache()` que devuelva
      `{ org, role }`. Hoy el layout del org y cada página repiten la
      búsqueda de la organización por slug y la membresía.
- [ ] Paralelizar con `Promise.all` las consultas independientes de
      `settings`, `locations`, `rights`, `audit`, `analytics` y `scan`
      (hoy son 3–4 `await` secuenciales cada una).
- [ ] `audit()` dentro de `after()` en las actions donde el registro no
      condiciona la respuesta (requiere confirmar con el threat model en
      `docs/SECURITY.md` que el audit diferido es aceptable).

### Fase 3 — base de datos (impacto creciente con el volumen)

- [ ] Migración con índices para las 24 FKs sin índice que reporta el advisor
      (prioridad: `customer_cards.customer_id`,
      `loyalty_accounts.customer_id`, `loyalty_accounts.program_id`,
      `redemptions.customer_id`, `wallet_passes.customer_id`).
      Coordinar la numeración con las migraciones pendientes del worktree
      `.worktrees/qa` (0017–0021).
- [ ] Reescribir la policy `visits_insert` con `(select auth.uid())`.
- [ ] Evaluar si `customers_org_phone_idx` / `customers_org_email_idx` se
      usan en la búsqueda de duplicados antes de borrarlos.

### Fase 4 — navegación instantánea real (impacto alto, esfuerzo medio)

- [ ] Quitar `instant = false` página por página y envolver las partes
      dinámicas en `<Suspense>` para que el layout y los encabezados se
      prerendericen (App Shell) y solo los datos se transmitan en streaming.
      Seguir `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`.
- [ ] Mensajes de éxito/error de las actions con `useActionState` en lugar de
      `redirect(?ok=…)`: evita volver a renderizar layouts y página completos
      tras cada acción.
- [ ] Actualizaciones optimistas (`useOptimistic`) en el escáner para mostrar
      el sello sumado antes de la confirmación del servidor.

### Fase 5 — medición

- [ ] Activar Vercel Speed Insights / Web Vitals (INP es la métrica que
      captura "el clic tarda en reaccionar").
- [ ] Registrar `Server-Timing` en las actions críticas (`scanCard`,
      `redeemReward`) para medir el tiempo por etapa.

## Cómo verificar

1. Tras el deploy, en Vercel → Project → Settings → Functions, confirmar que
   la región es **São Paulo (gru1)**.
2. Panel → Registrar visita: el botón debe cambiar a "Registrando…" de
   inmediato y la confirmación debe llegar en menos de ~0,5 s.
3. Navegar entre secciones del menú: aparece el spinner en la píldora y el
   skeleton en el contenido de inmediato.
4. Clientes → Buscar: sin recarga completa de la página (la barra del
   navegador no muestra carga del documento).
