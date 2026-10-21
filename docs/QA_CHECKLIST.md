# QA — Plan de corrección de hallazgos (auditoría Playwright 2026-10-21)

> Origen: recorrido completo de la app con Playwright MCP sobre `localhost:3000`
> contra el Supabase real, más un smoke test de producción.
> **Actualización automática:** no editar el bloque de progreso a mano.
>
> - Al cerrar una tarea, el commit (o el título/cuerpo del PR que se fusiona en
>   `main`) debe decir `Closes QA-C1` (también valen `fixes`, `resuelve`,
>   `cierra`, `corrige`; varias: `Closes QA-C1, QA-C2`).
> - Tras `git pull` en `main` el hook `post-merge` ejecuta el `sync` y marca
>   las tareas cerradas (`git config core.hooksPath .githooks`, una vez).
> - Manual: `python scripts/checklist.py --file docs/QA_CHECKLIST.md sync`
>   · `status` · `doing QA-C1` · `blocked QA-C1` · `note QA-C1 "texto"`.

<!-- PROGRESS:START -->
**Última actualización:** 2026-10-21 19:08  
**Global:** 37/40 hechas (92%) `██████████████████░░` · en curso: 0 · bloqueadas: 0

| Sección | Hecho | Total | % | Progreso |
|---|---|---|---|---|
| Fase 1 — Críticos: seguridad y alta de comercios | 4 | 4 | 100% | `██████████` |
| Fase 2 — Altos: flujos rotos y cumplimiento | 12 | 12 | 100% | `██████████` |
| Fase 3 — Medios: UX, consistencia y pruebas | 8 | 8 | 100% | `██████████` |
| Fase 4 — Bajos: pulido | 10 | 11 | 91% | `█████████░` |
| Fase 5 — Producto pendiente | 1 | 2 | 50% | `█████░░░░░` |
| Verificación de la auditoría | 2 | 3 | 67% | `███████░░░` |
<!-- PROGRESS:END -->

## Estado al 21/10/2026 — qué llevamos y qué falta

**Hecho y desplegado en producción** (PR #56, migraciones 0017 a 0021 aplicadas): las 5 fases del plan.
Críticos, altos, medios y bajos resueltos; cerrar/eliminar organización verificado en producción;
la plataforma ya no lleva rastro de ningún comercio cliente.

| Pendiente | Estado | Quién / qué se necesita |
|---|---|---|
| QA-P3 Planes y cobro | Pendiente | Dueño: elegir proveedor de pagos y definir los planes (`docs/BILLING_PLAN.md`) |
| QA-B11 Landing | Parcial: guías en curso en otra sesión | Sesión de landing: "Pago seguro" y "Próximamente" restantes |
| QA-V3 Limpiar datos de prueba | Pendiente (no limpiar aún) | Dueño: avisar cuándo; se borra desde el panel de Supabase |
| Seguimiento opcional | CSP en modo `report-only`; DMARC `p=none` | Pasar a bloqueo cuando no haya reportes |

**Decididos y fuera del plan:** Apple Wallet (no se ofrecerá por ahora) y QA-A12 (el SMTP actual con
`notificaciones@pineappleloyalty.com` se deja como está).

## Leyenda

- `[ ]` pendiente · `[~]` en curso · `[x]` hecho · `[!]` bloqueado
- IDs: `QA-C*` crítico · `QA-A*` alto · `QA-M*` medio · `QA-B*` bajo ·
  `QA-P*` producto · `QA-V*` verificación.
- Cada tarea lista **Dónde**, **Cómo** y **Hecho cuando** (criterio de
  aceptación verificable — preferir un test que falle antes del arreglo).

## Orden recomendado

1. Fase 1 entera en un solo PR de migración + acciones (C1 y C2 tocan la misma
   política; C3 es trigger en la misma migración). Desbloquea el alta de
   comercios en producción.
2. QA-C4 y Fase 2 en PRs pequeños, uno por tarea.
3. QA-M7 (tests) en paralelo desde el principio: cada arreglo de Fase 1-2 trae
   su test.
4. Fases 3-4 cuando la 2 esté cerrada.

---

## Fase 1 — Críticos: seguridad y alta de comercios

- [x] <!-- QA-C1 --> Crear organización falla siempre (RLS 42501 en `insert().select()`) — _commit f75eb42_
  - **Dónde:** `apps/web/lib/organizations/actions.ts` (`createOrganization`), policy `org_select_member`.
  - **Cómo:** RPC `create_organization(p_name, p_slug, p_brand jsonb)` `security definer`, `search_path` fijo, que inserta la org **y** la membresía owner en la misma transacción y devuelve el id. La action llama a la RPC; se elimina el insert directo.
  - **Hecho cuando:** test SQL en el job `sql` (crear org como `authenticated` → 1 org + 1 owner) y E2E: `/dashboard/new` → org visible en `/dashboard`.
- [x] <!-- QA-C2 --> Cualquier usuario puede insertarse como owner de una org ajena (`members_insert`) — _commit f75eb42_
  - **Dónde:** `supabase/migrations/20261009000001_rls_policies.sql:81`.
  - **Cómo:** nueva migración que reemplaza la policy: quitar la rama `(user_id = auth.uid() and role = 'owner')`; el bootstrap pasa por la RPC de QA-C1. Revocar `insert` directo en `organizations` para `authenticated`.
  - **Hecho cuando:** test SQL: usuario B intenta `insert into organization_members (org de A, B, 'owner')` → error; usuario A sigue pudiendo invitar.
- [x] <!-- QA-C3 --> Se puede dejar una org sin owner (auto-degradación o admin degradando al owner) — _commit f75eb42_
  - **Dónde:** `lib/admin/actions.ts` (`setMemberRole`, `setMemberStatus`), tabla `organization_members`.
  - **Cómo:** trigger `before update or delete` que rechaza dejar 0 owners activos; solo un owner puede asignar o quitar el rol `owner`; un admin no puede modificar a un owner. Mensaje claro en la UI.
  - **Hecho cuando:** tests SQL: único owner → staff falla; admin → cambia owner falla; owner promueve a otro owner y luego se degrada → ok.
- [x] <!-- QA-C4 --> App del cliente con marca de Fruppy fija para todos los comercios — _commit f75eb42_
  - **Dónde:** `app/t/[token]/_components/loyalty-card.tsx`, `escanear/page.tsx`, `perfil/page.tsx` (`/brand/logo.png`, alt "Fruppy Helados"); `_components/promos.ts` (promos estáticas); `_components/cards.tsx:241` (horario "Lun-Dom 12:00-21:00"); `wallet/apple/route.ts` (`fruppy-card.pkpass`).
  - **Cómo:** logo vía `/logo/[orgId]` con fallback a iniciales; `alt` = nombre del comercio. `/promociones`: leer campañas/promos del comercio o mostrar estado vacío (no contenido de otro comercio). Horario: campo opcional en sedes u ocultarlo. Nombre del `.pkpass` con el slug.
  - **Hecho cuando:** E2E con una org ≠ Fruppy: ningún texto "Fruppy" ni `/brand/logo.png` en `/t/*`.

## Fase 2 — Altos: flujos rotos y cumplimiento

- [x] <!-- QA-A1 --> No hay recuperación de contraseña — _commit 82db791_
  - **Dónde:** `app/(auth)/login/page.tsx`, `lib/auth/actions.ts`.
  - **Cómo:** enlace "¿Olvidaste tu contraseña?" → `resetPasswordForEmail` (redirect a `/auth/callback?next=/auth/nueva-clave`) + página para fijar la nueva clave (`updateUser`). Respuesta genérica (anti-enumeración).
  - **Hecho cuando:** E2E hasta el envío del correo; prueba manual del enlace.
- [x] <!-- QA-A2 --> "Invitación enviada" no envía ningún correo — _commit 82db791_
  - **Dónde:** `lib/admin/actions.ts` (`inviteMember`), `lib/email/outbox.ts`.
  - **Cómo:** encolar correo de invitación en el outbox (enlace a `/signup` o `/login` con el email prellenado); además, poder reenviar o cancelar.
  - **Hecho cuando:** invitar crea una fila en el outbox y el drain la envía; el texto de éxito refleja lo que pasó.
- [x] <!-- QA-A3 --> El código de tarjeta con espacios ("4ec3 c05f …") es rechazado en Registrar visita — _commit 82db791_
  - **Dónde:** `lib/loyalty/actions.ts` (`scanCard`).
  - **Cómo:** normalizar: quitar espacios y guiones y pasar a minúsculas antes de validar; aceptar también la URL completa de la tarjeta.
  - **Hecho cuando:** test unitario de normalización + E2E con el código tal como lo muestra `/escanear/codigo`.
- [x] <!-- QA-A4 --> Tarjeta revocada no se puede reemplazar ("Emitir tarjeta" no aparece) — _commit 82db791_
  - **Dónde:** `app/dashboard/[org]/customers/[id]/page.tsx:355`, `issueCard`.
  - **Cómo:** `reissueCard` (reutiliza `rotate_card_token`, que ya reactiva con token nuevo; el saldo vive en la cuenta). En la ficha: tarjeta revocada → solo "Reemitir tarjeta"; activa → Rotar QR / Wallet / Revocar. (El badge "Cliente activo" de la tarjeta revocada va en QA-B8.)
  - **Hecho cuando:** E2E: revocar → emitir nueva → sello con el token nuevo ok; el token viejo sigue rechazado.
- [x] <!-- QA-A5 --> Plazos legales invertidos en Derechos (Ley 1581: consultas 10 días hábiles, reclamos 15) — _commit 82db791_
  - **Dónde:** `app/dashboard/[org]/rights/page.tsx`.
  - **Cómo:** corregir el texto y calcular el vencimiento por solicitud según el tipo (consulta o reclamo) y mostrarlo.
  - **Hecho cuando:** el texto coincide con los arts. 14-15; cada solicitud muestra su fecha límite.
- [x] <!-- QA-A6 --> Solicitud "En trámite" ya no se puede resolver ni rechazar — _commit 82db791_
  - **Dónde:** `lib/admin/actions.ts` (`updateRightsRequest`: filtra `status = 'open'` y pone `resolved_at` también en `in_progress`).
  - **Cómo:** permitir `open|in_progress → resolved|rejected`; `resolved_at` solo al cerrar.
  - **Hecho cuando:** test: open → in_progress → resolved ok.
- [x] <!-- QA-A7 --> Resolver una solicitud no responde al titular ni ejecuta la supresión — _commit 82db791_
  - **Dónde:** `rights/page.tsx`, `updateRightsRequest`, RPC de supresión/anonimización.
  - **Cómo:** campo de respuesta obligatorio al cerrar → correo al titular vía outbox; para "Eliminar mis datos" o "Retirar autorización", acción que anonimiza el cliente (el ledger se conserva sin PII) y revoca sus tarjetas.
  - **Hecho cuando:** E2E: solicitud de eliminación → resolver → cliente anonimizado + correo en outbox.
- [x] <!-- QA-A8 --> Se aceptan registros por QR sin canal de privacidad configurado — _commit 82db791_
  - **Dónde:** RPC `resolve_join` / `register` route, `settings` (Privacidad).
  - **Cómo:** el autorregistro por QR exige `privacy_email` (y responsable); si falta, `/join` muestra "no disponible" y Configuración lo marca como requisito.
  - **Hecho cuando:** org sin correo de privacidad → `/join/[token]` no permite registrarse.
- [x] <!-- QA-A9 --> Redirecciones del cliente saltan al dominio de producción (local y previews de Vercel) — _commit 82db791_
  - **Dónde:** `app/join/[token]/register/route.ts:159`, `app/t/[token]/{rights,prefs,consent}/route.ts` (usan `NEXT_PUBLIC_BASE_URL`).
  - **Cómo:** redirigir con URL relativa a la petición (`new URL(path, req.url)`); `NEXT_PUBLIC_BASE_URL` solo para enlaces que salen del sitio (correos, QR, Wallet).
  - **Hecho cuando:** en local, registrar por QR y enviar derechos/preferencias se queda en `localhost`.
- [x] <!-- QA-A10 --> Faltan cabeceras de seguridad en producción y `/api/health` dice `env: local` — _commit 82db791_
  - **Dónde:** `apps/web/next.config.ts` (`headers()`), variable `APP_ENV` en Vercel.
  - **Cómo:** CSP (empezar en `Report-Only`), `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (cámara solo en `/dashboard/*/scan`). Definir `APP_ENV=production`.
  - **Hecho cuando:** `curl -I` en producción muestra las cabeceras y health responde `production`.
- [x] <!-- QA-A11 --> No se puede eliminar ningún usuario que haya operado (ledger append-only bloquea `on delete set null`) — _commit 82db791_
  - **Dónde:** FKs `performed_by`/`actor_user_id` → `auth.users` con `on delete set null` en tablas append-only (`loyalty_transactions`…).
  - **Cómo:** (mejor que `restrict`) el trigger append-only tolera SOLO desvincular `performed_by`/`location_id` a NULL: borrar un usuario del panel conserva el ledger sin su identidad. Un único owner sigue sin poder borrarse (QA-C3).
  - **Hecho cuando:** existe un flujo (script o acción admin) que da de baja una cuenta con historial sin violar el ledger; test SQL.
- [x] <!-- QA-A12 --> El correo de confirmación de cuenta llega a "Correo no deseado" (Outlook) — _decisión del dueño 21/10/2026: se mantiene notificaciones@pineappleloyalty.com_
  - **Decisión del dueño (21/10/2026):** los correos de la plataforma ya salen de `notificaciones@pineappleloyalty.com`, configurado y desplegado: **se deja como está**. `docs/EMAIL_AUTH_SMTP.md` queda solo como referencia opcional (usa `no-reply@`; no se aplica).
  - Si el spam reaparece: revisar SPF/DKIM/DMARC de `pineappleloyalty.com` (hoy DMARC `p=none`) y mail-tester.
## Fase 3 — Medios: UX, consistencia y pruebas

- [x] <!-- QA-M1 --> Los formularios se vacían tras un error de validación (signup, sedes, nuevo cliente, duplicado) — _commit 711a463_
  - **Cómo:** migrar a `useActionState` devolviendo `{ error, values }` en vez de `redirect(?error=)`; o `defaultValue` desde el estado. Prioridad: signup y nuevo cliente (duplicado).
  - **Hecho cuando:** E2E: error de validación → los campos conservan lo escrito.
- [x] <!-- QA-M2 --> Sin estado de envío; acciones irreversibles sin confirmación — _commit 711a463_
  - **Cómo:** `SubmitButton` común con `useFormStatus` (deshabilita y muestra "Guardando…"); confirmación en Canjear, Revocar tarjeta, Rotar QR (tarjeta y registro), Archivar, Cancelar campaña.
  - **Hecho cuando:** doble clic no duplica el registro; las acciones irreversibles piden confirmación.
- [x] <!-- QA-M3 --> Los datos de negocio del signup no se usan (hay que reescribir el nombre) — _commit 711a463_
  - **Cómo:** tras confirmar el correo, si el usuario no tiene orgs y tiene `user_metadata.business`, prellenar `/dashboard/new` (o crear la org automáticamente vía la RPC de QA-C1). Depende de QA-C1.
  - **Hecho cuando:** registro → confirmación → login → la org (o el formulario prellenado) aparece sin reescribir datos.
- [x] <!-- QA-M4 --> Archivar cliente e importar CSV solo existen en el panel Fruppy — _commit 711a463_
  - **Dónde:** `app/dashboard/[org]/_fruppy/customers.tsx`, `_fruppy/import-csv.tsx`.
  - **Cómo:** llevar ambos componentes al panel genérico (`customers/page.tsx`, `customers/[id]/page.tsx`).
  - **Hecho cuando:** org ≠ Fruppy puede archivar e importar.
- [x] <!-- QA-M5 --> Consentimiento: rótulo ambiguo, el staff lo registra por el cliente, el alta manual no exige autorización de datos — _commit 711a463_
  - **Dónde:** `customers/[id]/page.tsx:412`, `customers/new`, `lib/customers/actions.ts`.
  - **Cómo:** rotular "Consentimiento de marketing"; mostrar también la autorización de tratamiento (fecha, versión, canal). El registro por staff exige evidencia (canal + nota) y queda auditado como `staff`. En el alta manual, la casilla de autorización de tratamiento es obligatoria.
  - **Hecho cuando:** la ficha muestra ambos consentimientos con su origen; el alta manual sin autorización falla.
- [x] <!-- QA-M6 --> Error de Next "`Date.now()` while prerendering" en todas las rutas con Supabase — _commit 711a463_
  - **Dónde:** `/t/[token]`, `/join/[token]`, `/dashboard/*` (cacheComponents).
  - **Cómo:** `await connection()` antes del cliente Supabase en `lib/supabase/server.ts` o en los layouts afectados; verificar con `next build` que no queden avisos.
  - **Hecho cuando:** consola del navegador en dev sin el error en las rutas de la auditoría.
- [x] <!-- QA-M7 --> Cobertura de tests insuficiente (7 tests: env y wallet) — _commit 711a463_
  - **Cómo:** (a) tests SQL de RLS y ledger en el job `sql` (crear org, aislamiento entre orgs, sello, canje, reverso); (b) E2E Playwright en CI para: signup → login, crear org, programa → recompensa → registro QR → sello → canje, derechos. Usar rama temporal de Neon o el stub de CI.
  - **Hecho cuando:** CI corre los nuevos tests y habría fallado con QA-C1 y QA-C2.
- [x] <!-- QA-M8 --> `PLAN_VERIFICAR_REGISTRO.md` desactualizado — _commit 711a463_
  - **Cómo:** documentar que repetir el registro con un correo **sin confirmar** reenvía la confirmación (no muestra "ya está registrado"), y que el plan asumía auto-creación de org que no existe (ver QA-M3).
  - **Hecho cuando:** el documento refleja el comportamiento real.

## Fase 4 — Bajos: pulido

- [x] <!-- QA-B1 --> Textos técnicos o en inglés en la UI — _commit a6b6e5a_
  - "stamps", "active", roles `owner/admin/manager/staff`, historial con `qr_scan`, `staff_qr`, `redemption:<uuid>`, `(completed)`. Diccionario de etiquetas en español.
- [x] <!-- QA-B2 --> Equipo lista a los miembros por UUID en vez de email o nombre — _commit a6b6e5a_
  - RPC o vista que exponga email y nombre de los miembros de mi org.
- [x] <!-- QA-B3 --> Accesibilidad: dos "Revocar" con distinto efecto, toggle de notificaciones sin nombre, dos `<main>` en el DOM tras navegar — _commit a6b6e5a_
  - Textos únicos ("Revocar tarjeta" / "Retirar consentimiento"), `aria-label` en el toggle, revisar landmarks.
- [x] <!-- QA-B4 --> Móvil (390 px): el botón "Buscar" de Clientes queda fuera de pantalla — _commit a6b6e5a_
  - Filtros con `flex-wrap` o en dos filas.
- [x] <!-- QA-B5 --> El CSV de clientes no lleva BOM UTF-8 (Excel muestra mal tildes y ñ) — _commit a6b6e5a_
  - Prefijar `﻿` en `customers/export/route.ts`.
- [x] <!-- QA-B6 --> Configuración: el color por defecto `#16a34a` falla el contraste; la vista previa usa "8 / 9" fijo — _commit a6b6e5a_
  - Color por defecto ≥ 4.5:1 con blanco; la vista previa usa la meta real del programa.
- [x] <!-- QA-B7 --> El QR de registro no tiene "Descargar / Imprimir" (la landing lo promete) — _commit a6b6e5a_
  - Botón de descarga PNG (`/join/qr`) y vista imprimible.
- [x] <!-- QA-B8 --> La tarjeta revocada sigue mostrando "Cliente activo" — _commit a6b6e5a_
  - Badge según el estado de la tarjeta.
- [x] <!-- QA-B9 --> Sedes favoritas solo en `localStorage` (se pierden al cambiar de dispositivo) — _commit a6b6e5a_
  - Persistir por tarjeta en servidor, o aclarar en la UI que son locales.
- [x] <!-- QA-B10 --> Contacto solo `mailto`, preguntas sin anclas, límites inconsistentes entre FAQ y landing — _commit a6b6e5a_
  - `/contacto` con formulario real (correo al equipo, reply-to, honeypot); `/preguntas` con anclas por pregunta (`#app-cliente`, `#registro`, `#puntos-sellos`, `#wallet`, `#planes`, `#promociones`, `#datos`, `#cancelar`); FAQ alineada con el plan Gratis de la landing (50 clientes); remitente por defecto de la plataforma.
- [ ] <!-- QA-B11 --> Landing (`app/page.tsx`, `app/_landing/*`): promesas que el producto aún no cumple
  - **Ya en `main`** (PR #55 y #57): "Temas más consultados" y los "recursos destacados" falsos se retiraron; ejemplos sin cliente real.
  - **En curso en otra sesión (sin commitear a 21/10):** sección de guías `/guias` (configurar programa, registro por QR, campañas, reportes) que reemplaza el "Próximamente" de Guías.
  - **Pendiente:** (1) "Pago seguro / Pagos en línea protegidos" (`page.tsx` ~l.622) mientras no haya cobro (QA-P3); (2) los "Próximamente" de Videos y Plantillas: quitarlos o convertirlos en lista de espera.
  - **Dónde:** `fix/landing-copy-y-ajustes-ui` / la sesión de landing: no tocar desde este plan para evitar conflictos.
  - **Hecho cuando:** la landing no promete nada que el producto no hace.
## Fase 5 — Producto pendiente

> **Fuera de alcance (decisión del dueño, 21/10/2026): Apple Wallet.** No se ofrecerá por
> ahora; solo Google Wallet. El código queda desactivado (la ruta responde 404 y el botón
> no se muestra) y se retiró del plan.

- [x] <!-- QA-P2 --> Eliminar o cerrar una organización (no existe; necesario también para limpiar datos de prueba) — _commit d63f724_
  - Migración 0021: `close_organization` (soft, conserva el ledger) y `delete_organization` (solo sin historial, exige el slug); UI en Configuración → Zona de peligro (solo owner); las orgs cerradas no se listan ni se abren. Además `status`/`limits` dejan de ser editables por el admin.
- [ ] <!-- QA-P3 --> Planes y pagos (la landing muestra precios Pro y Business, pero no hay cobro ni límites por plan salvo campañas)
  - Requiere decisiones de negocio y una cuenta de pagos: propuesta técnica y preguntas en `docs/BILLING_PLAN.md`.

## Verificación de la auditoría

- [x] <!-- QA-V1 --> Confirmación de email de cuenta nueva de punta a punta (registro → correo → enlace → login) — _2026-10-21: signup → aviso → login bloqueado sin confirmar → enlace del correo (mismo navegador, PKCE) → /dashboard; login con clave ok. Correo llegó a spam (QA-A12)_
- [x] <!-- QA-V2 --> Envío real de campaña push ("Enviar ahora") a un cliente suscrito — _2026-10-21: org qa-push, 1 suscripción FCM, 'Enviar ahora' → 1 entregada; notificación mostrada por el service worker_
- [ ] <!-- QA-V3 --> Limpiar datos de prueba en Supabase de producción — **pendiente: aún NO limpiar (decisión del dueño)**
  - Ya eliminadas por mí: org `qa-push` y org de verificación `qa-verificacion-deploy` (probaron QA-P2).
  - **Siguen:** org `qa-playwright` (`12086a8b-7df0-4b97-8aad-3b25add919d1`; sin owner y con historial de sellos → se cierra, no se elimina; antes hay que devolverle un owner) y las cuentas `pineappleloyalty@outlook.com` (`a3665605-…`) y `pineappleloyalty+qa1@outlook.com`.
  - Se borran desde Supabase → Authentication → Users (el MCP no ejecuta `delete`).
