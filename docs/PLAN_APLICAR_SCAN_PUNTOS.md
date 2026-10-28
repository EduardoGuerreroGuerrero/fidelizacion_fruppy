# Plan: aplicar y verificar `scan_card` con soporte de puntos

Documento de traspaso para otro agente. Estado a 2026-10-21.

## 1. Contexto

El flujo "Registrar visita" (`/dashboard/[org]/scan`) estaba fijo a **sellos**
aunque el programa de la tarjeta fuera por **puntos**. Se corrigió:

- **Código (YA en `main` y desplegado en Vercel)**: PR #67, merge `ab009bb`.
  - `apps/web/app/dashboard/[org]/scan/page.tsx`: lee los tipos de programa
    activos de la organización y pasa `hasStamps` / `hasPoints` al formulario.
  - `apps/web/app/dashboard/[org]/scan/scan-form.tsx`: muestra "Sellos a
    otorgar" y/o "Monto de la compra" según esos flags.
  - `apps/web/lib/loyalty/actions.ts` (`scanCard`): envía `p_amount` solo si
    hay monto válido; traduce `amount_required`; el mensaje de éxito
    distingue puntos (`+N puntos (total M)`) de sellos.
- **Base de datos (PENDIENTE en producción)**:
  `supabase/migrations/20261021000022_scan_card_points.sql`.
  - Elimina `scan_card(text,int,uuid,text)` y crea
    `scan_card(text,int,uuid,text,numeric)` (5.º parámetro `p_amount`, opcional).
  - Programa `points`: exige `p_amount > 0` (si no, `amount_required`);
    puntos = `floor(p_amount * points_per_currency_unit)`; guarda
    `amount_minor = round(p_amount*100)`. Si da 0 puntos, solo registra la visita.
  - Programa `stamps`: igual que antes (`p_stamps`), ignora `p_amount`.
  - Devuelve `get_card_public` + `points_earned`.
  - Prueba e2e ya añadida en `supabase/tests/e2e_loyalty.sql` (T11c-T11e y
    ajustes en T12 y en el chequeo de privilegios). CI `sql` pasó en verde.

**Efecto de que falte la migración**: el formulario ya pide el monto, pero la
función antigua de producción solo otorga sellos → en tarjetas por puntos no
se suma nada. Los programas por sellos funcionan igual con o sin migración.

## 2. Por qué no se aplicó ya

La llamada `mcp__supabase-mcp-server__apply_migration` fue rechazada 5 veces
(`{"status":"declined"}`) aunque el usuario dio autorización verbal y existe la
regla `mcp__supabase-mcp-server` en `.claude/settings.local.json`. No es un
problema de reglas de configuración: otra capa bloquea cambios de esquema en
producción hechos por un agente. **No esquivarlo** con `execute_sql`, Neon ni
otra vía equivalente. Si el agente siguiente tampoco puede, la aplicación la
hace el usuario a mano (paso 3B).

## 3. Pasos

Datos: proyecto Supabase de producción `fidelizacion-fruppy`, ref
`itqnpobhrojviftqtwgv`. Migración: archivo del repo (no reescribir el SQL;
copiarlo tal cual).

### 3A. Aplicar con herramienta (intento único)

1. `mcp__supabase-mcp-server__list_migrations` con `project_id` — confirmar
   que `20261021000022_scan_card_points` NO aparece.
2. `mcp__supabase-mcp-server__apply_migration` con `name`
   `20261021000022_scan_card_points` y `query` = contenido íntegro del archivo.
3. Si responde `declined`, parar y pasar a 3B. No reintentar en bucle.

### 3B. Aplicar a mano (usuario)

1. Abrir https://supabase.com/dashboard/project/itqnpobhrojviftqtwgv/sql/new
2. Pegar todo el contenido de
   `supabase/migrations/20261021000022_scan_card_points.sql` y pulsar Run.
3. Debe responder "Success". El usuario avisa con "listo".

### 3C. Verificar en BD (solo lectura)

Con `execute_sql` (SELECT únicamente) o el SQL Editor:

```sql
-- 1) existe solo la firma nueva (5 parámetros)
select pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'scan_card';
-- esperado: 1 fila → p_token text, p_stamps integer, p_location_id uuid,
--           p_idempotency_key text, p_amount numeric

-- 2) permisos: authenticated sí, anon no
select has_function_privilege('authenticated',
         'public.scan_card(text,integer,uuid,text,numeric)', 'execute') as auth_ok,
       has_function_privilege('anon',
         'public.scan_card(text,integer,uuid,text,numeric)', 'execute') as anon_ok;
-- esperado: auth_ok = true, anon_ok = false
```

Además `list_migrations` debe mostrar la 0022 registrada.

### 3D. Verificar en la app (Playwright, `mcp__playwright__*`)

Requiere credenciales de un usuario de prueba con rol staff/manager/admin en
una organización que tenga un programa **por puntos** activo y una tarjeta.
Si no hay credenciales, pedirlas al usuario; **no** crear datos en producción
sin avisarle.

1. Login y abrir `/dashboard/<slug>/scan`.
2. Con programa por puntos activo debe verse el campo "Monto de la compra".
   Con ambos tipos, se ven los dos campos.
3. Escanear/pegar el token de una tarjeta **por puntos** con monto, p. ej.
   `15000`. Esperado: mensaje `Visita registrada: <nombre> — +N puntos (total M)`
   con `N = floor(15000 × puntos_por_moneda)`.
4. Repetir sin monto en tarjeta por puntos. Esperado:
   "Este programa es por puntos: ingresa el monto de la compra."
5. Tarjeta **por sellos** con 1 sello: debe seguir mostrando `X/Y sellos`.
6. Regresión opcional: comparar el saldo en la ficha del cliente antes/después.

Nota: Playwright headless no tiene H.264; el intro de `/` se omite (esperado).

### 3E. Cierre

- Si algo falla, abrir rama `fix/...` y PR (ver reglas abajo). No tocar `main`.
- No hace falta redeploy de Vercel: el código ya está desplegado.
- Reportar al usuario: migración aplicada (cómo), resultados de 3C y 3D.

## 4. Reglas del proyecto que aplican

- `main` protegido: cambios solo por rama + PR; checks `build` y `sql`
  obligatorios; sin push directo ni force-push.
- GitHub CLI: `%LOCALAPPDATA%\gh-cli\bin\gh.exe`; token vía `GH_TOKEN` desde el
  Credential Manager (`git credential fill`), sin `gh auth login`.
- `python` del PATH puede ser Python 2: usar
  `C:/Users/Acer/anaconda3/envs/F_FRUPPY/python.exe`.
- Verificación local: `npm run lint && npm run typecheck && npm run test && npm run build`.
- Responder al usuario siempre en español.
- No exponer secretos. Ningún comercio cliente aparece en código/textos.
- El directorio `.worktrees/qa` pertenece a otra sesión; no modificarlo.

## 5. Criterio de "terminado"

- [ ] `scan_card` de producción con firma de 5 parámetros y permisos correctos.
- [ ] Migración 0022 registrada en `list_migrations`.
- [ ] Escaneo de tarjeta por puntos suma `floor(monto × ppcu)` y lo muestra.
- [ ] Escaneo por sellos sin regresión.
- [ ] Usuario informado del resultado.
