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
**Última actualización:** 2026-10-21 14:47  
**Global:** 2/40 hechas (5%) `█░░░░░░░░░░░░░░░░░░░` · en curso: 0 · bloqueadas: 0

| Sección | Hecho | Total | % | Progreso |
|---|---|---|---|---|
| Fase 1 — Críticos: seguridad y alta de comercios | 0 | 4 | 0% | `░░░░░░░░░░` |
| Fase 2 — Altos: flujos rotos y cumplimiento | 0 | 12 | 0% | `░░░░░░░░░░` |
| Fase 3 — Medios: UX, consistencia y pruebas | 0 | 8 | 0% | `░░░░░░░░░░` |
| Fase 4 — Bajos: pulido | 0 | 10 | 0% | `░░░░░░░░░░` |
| Fase 5 — Producto pendiente | 0 | 3 | 0% | `░░░░░░░░░░` |
| Verificación de la auditoría | 2 | 3 | 67% | `███████░░░` |
<!-- PROGRESS:END -->

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

- [ ] <!-- QA-C1 --> Crear organización falla siempre (RLS 42501 en `insert().select()`)
  - **Dónde:** `apps/web/lib/organizations/actions.ts` (`createOrganization`), policy `org_select_member`.
  - **Cómo:** RPC `create_organization(p_name, p_slug, p_brand jsonb)` `security definer`, `search_path` fijo, que inserta la org **y** la membresía owner en la misma transacción y devuelve el id. La action llama a la RPC; se elimina el insert directo.
  - **Hecho cuando:** test SQL en el job `sql` (crear org como `authenticated` → 1 org + 1 owner) y E2E: `/dashboard/new` → org visible en `/dashboard`.
- [ ] <!-- QA-C2 --> Cualquier usuario puede insertarse como owner de una org ajena (`members_insert`)
  - **Dónde:** `supabase/migrations/20261009000001_rls_policies.sql:81`.
  - **Cómo:** nueva migración que reemplaza la policy: quitar la rama `(user_id = auth.uid() and role = 'owner')`; el bootstrap pasa por la RPC de QA-C1. Revocar `insert` directo en `organizations` para `authenticated`.
  - **Hecho cuando:** test SQL: usuario B intenta `insert into organization_members (org de A, B, 'owner')` → error; usuario A sigue pudiendo invitar.
- [ ] <!-- QA-C3 --> Se puede dejar una org sin owner (auto-degradación o admin degradando al owner)
  - **Dónde:** `lib/admin/actions.ts` (`setMemberRole`, `setMemberStatus`), tabla `organization_members`.
  - **Cómo:** trigger `before update or delete` que rechaza dejar 0 owners activos; solo un owner puede asignar o quitar el rol `owner`; un admin no puede modificar a un owner. Mensaje claro en la UI.
  - **Hecho cuando:** tests SQL: único owner → staff falla; admin → cambia owner falla; owner promueve a otro owner y luego se degrada → ok.
- [ ] <!-- QA-C4 --> App del cliente con marca de Fruppy fija para todos los comercios
  - **Dónde:** `app/t/[token]/_components/loyalty-card.tsx`, `escanear/page.tsx`, `perfil/page.tsx` (`/brand/logo.png`, alt "Fruppy Helados"); `_components/promos.ts` (promos estáticas); `_components/cards.tsx:241` (horario "Lun-Dom 12:00-21:00"); `wallet/apple/route.ts` (`fruppy-card.pkpass`).
  - **Cómo:** logo vía `/logo/[orgId]` con fallback a iniciales; `alt` = nombre del comercio. `/promociones`: leer campañas/promos del comercio o mostrar estado vacío (no contenido de otro comercio). Horario: campo opcional en sedes u ocultarlo. Nombre del `.pkpass` con el slug.
  - **Hecho cuando:** E2E con una org ≠ Fruppy: ningún texto "Fruppy" ni `/brand/logo.png` en `/t/*`.

## Fase 2 — Altos: flujos rotos y cumplimiento

- [ ] <!-- QA-A1 --> No hay recuperación de contraseña
  - **Dónde:** `app/(auth)/login/page.tsx`, `lib/auth/actions.ts`.
  - **Cómo:** enlace "¿Olvidaste tu contraseña?" → `resetPasswordForEmail` (redirect a `/auth/callback?next=/auth/nueva-clave`) + página para fijar la nueva clave (`updateUser`). Respuesta genérica (anti-enumeración).
  - **Hecho cuando:** E2E hasta el envío del correo; prueba manual del enlace.
- [ ] <!-- QA-A2 --> "Invitación enviada" no envía ningún correo
  - **Dónde:** `lib/admin/actions.ts` (`inviteMember`), `lib/email/outbox.ts`.
  - **Cómo:** encolar correo de invitación en el outbox (enlace a `/signup` o `/login` con el email prellenado); además, poder reenviar o cancelar.
  - **Hecho cuando:** invitar crea una fila en el outbox y el drain la envía; el texto de éxito refleja lo que pasó.
- [ ] <!-- QA-A3 --> El código de tarjeta con espacios ("4ec3 c05f …") es rechazado en Registrar visita
  - **Dónde:** `lib/loyalty/actions.ts` (`scanCard`).
  - **Cómo:** normalizar: quitar espacios y guiones y pasar a minúsculas antes de validar; aceptar también la URL completa de la tarjeta.
  - **Hecho cuando:** test unitario de normalización + E2E con el código tal como lo muestra `/escanear/codigo`.
- [ ] <!-- QA-A4 --> Tarjeta revocada no se puede reemplazar ("Emitir tarjeta" no aparece)
  - **Dónde:** `app/dashboard/[org]/customers/[id]/page.tsx:355`, `issueCard`.
  - **Cómo:** `reissueCard` (reutiliza `rotate_card_token`, que ya reactiva con token nuevo; el saldo vive en la cuenta). En la ficha: tarjeta revocada → solo "Reemitir tarjeta"; activa → Rotar QR / Wallet / Revocar. (El badge "Cliente activo" de la tarjeta revocada va en QA-B8.)
  - **Hecho cuando:** E2E: revocar → emitir nueva → sello con el token nuevo ok; el token viejo sigue rechazado.
- [ ] <!-- QA-A5 --> Plazos legales invertidos en Derechos (Ley 1581: consultas 10 días hábiles, reclamos 15)
  - **Dónde:** `app/dashboard/[org]/rights/page.tsx`.
  - **Cómo:** corregir el texto y calcular el vencimiento por solicitud según el tipo (consulta o reclamo) y mostrarlo.
  - **Hecho cuando:** el texto coincide con los arts. 14-15; cada solicitud muestra su fecha límite.
- [ ] <!-- QA-A6 --> Solicitud "En trámite" ya no se puede resolver ni rechazar
  - **Dónde:** `lib/admin/actions.ts` (`updateRightsRequest`: filtra `status = 'open'` y pone `resolved_at` también en `in_progress`).
  - **Cómo:** permitir `open|in_progress → resolved|rejected`; `resolved_at` solo al cerrar.
  - **Hecho cuando:** test: open → in_progress → resolved ok.
- [ ] <!-- QA-A7 --> Resolver una solicitud no responde al titular ni ejecuta la supresión
  - **Dónde:** `rights/page.tsx`, `updateRightsRequest`, RPC de supresión/anonimización.
  - **Cómo:** campo de respuesta obligatorio al cerrar → correo al titular vía outbox; para "Eliminar mis datos" o "Retirar autorización", acción que anonimiza el cliente (el ledger se conserva sin PII) y revoca sus tarjetas.
  - **Hecho cuando:** E2E: solicitud de eliminación → resolver → cliente anonimizado + correo en outbox.
- [ ] <!-- QA-A8 --> Se aceptan registros por QR sin canal de privacidad configurado
  - **Dónde:** RPC `resolve_join` / `register` route, `settings` (Privacidad).
  - **Cómo:** el autorregistro por QR exige `privacy_email` (y responsable); si falta, `/join` muestra "no disponible" y Configuración lo marca como requisito.
  - **Hecho cuando:** org sin correo de privacidad → `/join/[token]` no permite registrarse.
- [ ] <!-- QA-A9 --> Redirecciones del cliente saltan al dominio de producción (local y previews de Vercel)
  - **Dónde:** `app/join/[token]/register/route.ts:159`, `app/t/[token]/{rights,prefs,consent}/route.ts` (usan `NEXT_PUBLIC_BASE_URL`).
  - **Cómo:** redirigir con URL relativa a la petición (`new URL(path, req.url)`); `NEXT_PUBLIC_BASE_URL` solo para enlaces que salen del sitio (correos, QR, Wallet).
  - **Hecho cuando:** en local, registrar por QR y enviar derechos/preferencias se queda en `localhost`.
- [ ] <!-- QA-A10 --> Faltan cabeceras de seguridad en producción y `/api/health` dice `env: local`
  - **Dónde:** `apps/web/next.config.ts` (`headers()`), variable `APP_ENV` en Vercel.
  - **Cómo:** CSP (empezar en `Report-Only`), `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (cámara solo en `/dashboard/*/scan`). Definir `APP_ENV=production`.
  - **Hecho cuando:** `curl -I` en producción muestra las cabeceras y health responde `production`.
- [ ] <!-- QA-A11 --> No se puede eliminar ningún usuario que haya operado (ledger append-only bloquea `on delete set null`)
  - **Dónde:** FKs `performed_by`/`actor_user_id` → `auth.users` con `on delete set null` en tablas append-only (`loyalty_transactions`…).
  - **Cómo:** (mejor que `restrict`) el trigger append-only tolera SOLO desvincular `performed_by`/`location_id` a NULL: borrar un usuario del panel conserva el ledger sin su identidad. Un único owner sigue sin poder borrarse (QA-C3).
  - **Hecho cuando:** existe un flujo (script o acción admin) que da de baja una cuenta con historial sin violar el ledger; test SQL.
- [ ] <!-- QA-A12 --> El correo de confirmación de cuenta llega a "Correo no deseado" (Outlook)
  - **Dónde:** Supabase → Auth → SMTP y plantillas; DNS de `pineappleloyalty.com`.
  - **Cómo:** SMTP propio (Resend, ya integrado para correos transaccionales) con dominio verificado: SPF, DKIM y DMARC; remitente `no-reply@pineappleloyalty.com`; plantilla en español con la marca.
  - **Hecho cuando:** el correo de confirmación llega a la bandeja principal de Outlook y Gmail (mail-tester ≥ 9/10).

## Fase 3 — Medios: UX, consistencia y pruebas

- [ ] <!-- QA-M1 --> Los formularios se vacían tras un error de validación (signup, sedes, nuevo cliente, duplicado)
  - **Cómo:** migrar a `useActionState` devolviendo `{ error, values }` en vez de `redirect(?error=)`; o `defaultValue` desde el estado. Prioridad: signup y nuevo cliente (duplicado).
  - **Hecho cuando:** E2E: error de validación → los campos conservan lo escrito.
- [ ] <!-- QA-M2 --> Sin estado de envío; acciones irreversibles sin confirmación
  - **Cómo:** `SubmitButton` común con `useFormStatus` (deshabilita y muestra "Guardando…"); confirmación en Canjear, Revocar tarjeta, Rotar QR (tarjeta y registro), Archivar, Cancelar campaña.
  - **Hecho cuando:** doble clic no duplica el registro; las acciones irreversibles piden confirmación.
- [ ] <!-- QA-M3 --> Los datos de negocio del signup no se usan (hay que reescribir el nombre)
  - **Cómo:** tras confirmar el correo, si el usuario no tiene orgs y tiene `user_metadata.business`, prellenar `/dashboard/new` (o crear la org automáticamente vía la RPC de QA-C1). Depende de QA-C1.
  - **Hecho cuando:** registro → confirmación → login → la org (o el formulario prellenado) aparece sin reescribir datos.
- [ ] <!-- QA-M4 --> Archivar cliente e importar CSV solo existen en el panel Fruppy
  - **Dónde:** `app/dashboard/[org]/_fruppy/customers.tsx`, `_fruppy/import-csv.tsx`.
  - **Cómo:** llevar ambos componentes al panel genérico (`customers/page.tsx`, `customers/[id]/page.tsx`).
  - **Hecho cuando:** org ≠ Fruppy puede archivar e importar.
- [ ] <!-- QA-M5 --> Consentimiento: rótulo ambiguo, el staff lo registra por el cliente, el alta manual no exige autorización de datos
  - **Dónde:** `customers/[id]/page.tsx:412`, `customers/new`, `lib/customers/actions.ts`.
  - **Cómo:** rotular "Consentimiento de marketing"; mostrar también la autorización de tratamiento (fecha, versión, canal). El registro por staff exige evidencia (canal + nota) y queda auditado como `staff`. En el alta manual, la casilla de autorización de tratamiento es obligatoria.
  - **Hecho cuando:** la ficha muestra ambos consentimientos con su origen; el alta manual sin autorización falla.
- [ ] <!-- QA-M6 --> Error de Next "`Date.now()` while prerendering" en todas las rutas con Supabase
  - **Dónde:** `/t/[token]`, `/join/[token]`, `/dashboard/*` (cacheComponents).
  - **Cómo:** `await connection()` antes del cliente Supabase en `lib/supabase/server.ts` o en los layouts afectados; verificar con `next build` que no queden avisos.
  - **Hecho cuando:** consola del navegador en dev sin el error en las rutas de la auditoría.
- [ ] <!-- QA-M7 --> Cobertura de tests insuficiente (7 tests: env y wallet)
  - **Cómo:** (a) tests SQL de RLS y ledger en el job `sql` (crear org, aislamiento entre orgs, sello, canje, reverso); (b) E2E Playwright en CI para: signup → login, crear org, programa → recompensa → registro QR → sello → canje, derechos. Usar rama temporal de Neon o el stub de CI.
  - **Hecho cuando:** CI corre los nuevos tests y habría fallado con QA-C1 y QA-C2.
- [ ] <!-- QA-M8 --> `PLAN_VERIFICAR_REGISTRO.md` desactualizado
  - **Cómo:** documentar que repetir el registro con un correo **sin confirmar** reenvía la confirmación (no muestra "ya está registrado"), y que el plan asumía auto-creación de org que no existe (ver QA-M3).
  - **Hecho cuando:** el documento refleja el comportamiento real.

## Fase 4 — Bajos: pulido

- [ ] <!-- QA-B1 --> Textos técnicos o en inglés en la UI
  - "stamps", "active", roles `owner/admin/manager/staff`, historial con `qr_scan`, `staff_qr`, `redemption:<uuid>`, `(completed)`. Diccionario de etiquetas en español.
- [ ] <!-- QA-B2 --> Equipo lista a los miembros por UUID en vez de email o nombre
  - RPC o vista que exponga email y nombre de los miembros de mi org.
- [ ] <!-- QA-B3 --> Accesibilidad: dos "Revocar" con distinto efecto, toggle de notificaciones sin nombre, dos `<main>` en el DOM tras navegar
  - Textos únicos ("Revocar tarjeta" / "Retirar consentimiento"), `aria-label` en el toggle, revisar landmarks.
- [ ] <!-- QA-B4 --> Móvil (390 px): el botón "Buscar" de Clientes queda fuera de pantalla
  - Filtros con `flex-wrap` o en dos filas.
- [ ] <!-- QA-B5 --> El CSV de clientes no lleva BOM UTF-8 (Excel muestra mal tildes y ñ)
  - Prefijar `﻿` en `customers/export/route.ts`.
- [ ] <!-- QA-B6 --> Configuración: el color por defecto `#16a34a` falla el contraste; la vista previa usa "8 / 9" fijo
  - Color por defecto ≥ 4.5:1 con blanco; la vista previa usa la meta real del programa.
- [ ] <!-- QA-B7 --> El QR de registro no tiene "Descargar / Imprimir" (la landing lo promete)
  - Botón de descarga PNG (`/join/qr`) y vista imprimible.
- [ ] <!-- QA-B8 --> La tarjeta revocada sigue mostrando "Cliente activo"
  - Badge según el estado de la tarjeta.
- [ ] <!-- QA-B9 --> Sedes favoritas solo en `localStorage` (se pierden al cambiar de dispositivo)
  - Persistir por tarjeta en servidor, o aclarar en la UI que son locales.
- [ ] <!-- QA-B10 --> Landing: "Pago seguro" sin pagos, recursos "Próximamente", Contacto solo `mailto`, "Temas más consultados" sin anclas
  - Ajustar textos a lo que existe; anclas `#id` en `/preguntas`; formulario de contacto (opcional).

## Fase 5 — Producto pendiente

- [ ] <!-- QA-P1 --> Apple Wallet (hoy 404: sin certificados)
- [ ] <!-- QA-P2 --> Eliminar o cerrar una organización (no existe; necesario también para limpiar datos de prueba)
- [ ] <!-- QA-P3 --> Planes y pagos (la landing muestra precios Pro y Business, pero no hay cobro ni límites por plan salvo campañas)

## Verificación de la auditoría

- [x] <!-- QA-V1 --> Confirmación de email de cuenta nueva de punta a punta (registro → correo → enlace → login) — _2026-10-21: signup → aviso → login bloqueado sin confirmar → enlace del correo (mismo navegador, PKCE) → /dashboard; login con clave ok. Correo llegó a spam (QA-A12)_
- [x] <!-- QA-V2 --> Envío real de campaña push ("Enviar ahora") a un cliente suscrito — _2026-10-21: org qa-push, 1 suscripción FCM, 'Enviar ahora' → 1 entregada; notificación mostrada por el service worker_
- [ ] <!-- QA-V3 --> Limpiar datos de prueba en Supabase de producción
  - Org "QA Playwright" (`qa-playwright`, `12086a8b-7df0-4b97-8aad-3b25add919d1`): cliente "Cliente QA", programa, sede, recompensa, campaña en borrador, invitación, solicitud de derechos.
  - Org "Heladería QA Push" (`qa-push`, `3129fa8b-5977-4b16-9b65-ed3ec5e782e3`): cliente "Cliente Push QA", suscripción push, campaña enviada.
  - Cuenta `pineappleloyalty+qa1@outlook.com` (owner de `qa-push`).
  - Cuenta vieja `pineappleloyalty@outlook.com` (`a3665605-…`): no se puede borrar (ledger, ver QA-A11); renombrar el email y banearla desde Supabase para liberar el correo.
