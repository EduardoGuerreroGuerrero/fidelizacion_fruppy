# Despliegue de las correcciones QA (fases 1-5)

Las correcciones traen **migraciones SQL que hay que aplicar en Supabase antes
de desplegar el código** (no hay Docker local ni `supabase db push` automático:
se pegan en *Supabase → SQL Editor*, en orden). Cada una ya pasó los tests de
`supabase/tests/*.sql` sobre Postgres real (rama temporal de Neon + job `sql`
de CI).

## Estado de aplicación en producción (2026-10-21)

Aplicado por MCP en `fidelizacion-fruppy`: 0017, 0018, 0020 y casi toda la 0019
y la 0021 (constraint de correos, `status = closed`, permisos por columna,
`resolve_join`, trigger del ledger, columna `response`).

**Falta pegar a mano** `supabase/manual_pendiente_qa.sql` en el SQL Editor: 4
funciones (`resolve_rights_request`, `register_customer_via_join`,
`close_organization`, `delete_organization`). El MCP rechaza cualquier migración
cuyo texto contenga `delete from`, incluso dentro de una función. Hasta
pegarlas: la pantalla de derechos (resolver) y Configuración → Zona de peligro
no funcionan. Fruppy ya tiene `privacy_email` configurado.

## 1. Aplicar migraciones (en orden)

| # | Archivo | Qué hace | Riesgo |
|---|---|---|---|
| 0017 | `20261021000017_org_bootstrap_and_owner_guard.sql` | `create_organization`, política de membresía corregida (QA-C1/C2), guardia de owners (C3) | Cierra el alta directa en `organizations`: **el código nuevo es obligatorio** (el viejo no podría crear orgs; hoy tampoco puede) |
| 0018 | `20261021000018_card_app_data_brand.sql` | La tarjeta del cliente expone logo/color/slug del comercio (C4) | Sin ella, la tarjeta del cliente muestra iniciales en vez del logo del comercio |
| 0019 | `20261021000019_rights_invites_privacy_ledger.sql` | Derechos de titulares, correos de equipo, canal de privacidad obligatorio, baja de usuarios (A2, A5-A8, A11) | **Ver aviso de privacidad abajo** |
| 0020 | `20261021000020_member_directory.sql` | Equipo con correo y nombre (B2) | Sin ella, Equipo funciona pero sin correos |
| 0021 | `20261021000021_org_close_delete_and_column_grants.sql` | Cerrar/eliminar organizaciones y columnas protegidas (P2) | Un admin ya no puede editar `status`/`limits` |

> El SQL Editor muestra los `NOTICE`. La 0019 imprime la lista de comercios que
> se quedan **sin correo de privacidad**.

### Aviso: correo de privacidad (0019)

Desde la 0019 el QR `/join/...` solo funciona si el comercio tiene
`Configuración → Privacidad y funciones → Correo de privacidad`. **Antes de
aplicarla, confirma que cada comercio con QR activo lo
tenga configurado**; si no, su QR mostrará "terminando de configurar su política
de privacidad" hasta que lo agregue.

## 2. Configuración fuera del repo

- **Correo de autenticación** (QA-A12): `docs/EMAIL_AUTH_SMTP.md` (SMTP propio
  con Resend + plantillas en `docs/supabase-email-templates/`).
- **Redirect URLs** de Supabase Auth: incluir `https://www.pineappleloyalty.com/auth/callback`
  (ya requerido por la confirmación de correo) — también sirve para la
  recuperación de contraseña.
- Variable opcional `SUPPORT_EMAIL` (destino del formulario de contacto;
  por defecto `soporte@pineappleloyalty.com`) y `APP_ENV=production` en Vercel.

## 3. Orden de merge de los PR

Los PR están encadenados (cada rama parte de la anterior). Mergear **en orden**
1 → 5 una vez aplicadas las migraciones; el job `build` de cada PR debe estar
verde. Tras cada merge, `git pull` en `main` ejecuta el hook `post-merge` que
marca las tareas cerradas en `docs/QA_CHECKLIST.md`.

## 4. Verificación posterior

1. Registro nuevo → confirmar correo → `/dashboard/new` (nombre prellenado) →
   crear organización → **debe funcionar**.
2. `/t/<token>` de cualquier comercio: solo su logo/color, sin contenido de otros comercios.
3. `/login` → "¿Olvidaste tu contraseña?" → correo → `/nueva-clave`.
4. Equipo: invitar un correo → llega el correo de invitación.
5. Derechos: una solicitud de supresión → resolver con respuesta → el cliente
   queda anonimizado y recibe el correo.
6. Limpieza de datos de prueba (QA-V3): con 0019 aplicada ya se puede borrar la
   cuenta vieja `pineappleloyalty@outlook.com`; con 0021, cerrar/eliminar las
   organizaciones `qa-playwright` y `qa-push` desde Configuración → Zona de peligro.
