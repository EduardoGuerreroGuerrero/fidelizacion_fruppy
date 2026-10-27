# Plan de mejora — registro multi-programa, rate limit, límites de gasto, UI y programas

Estado a 2026-10-26, sobre `main` (`4a05bde`). Revisado contra el código, la base de
producción (Supabase `itqnpobhrojviftqtwgv`) y la documentación oficial citada al final.

## Estado de ejecución (2026-10-27)

| # | Resultado | Verificado en producción |
|---|-----------|--------------------------|
| 1 | **Hecho.** Migración 0023 aplicada (aditiva: la firma de 7 parámetros pasó a envoltorio de la nueva, sin `drop`) | El selector muestra los 2 programas; un correo existente recibió la tarjeta del programa nuevo sin tocar la anterior |
| 4 | **Hecho.** Variante `dark:` neutralizada, `color-scheme: light`, componente `Badge`, 220 clases `dark:` retiradas y prueba que impide reintroducirlas | Con el sistema en modo oscuro las fichas de Clientes se leen bien |
| 3 | **Parcial.** Guardas en la app hechas (proxy, `maxDuration`, limpieza en cron). **Pendiente manual**: Spend Cap de Supabase y Spend Management de Vercel (ver `docs/COSTOS_Y_LIMITES.md`) | — |
| 2 | **Hecho.** Migración 0024 + `lib/ratelimit.ts` en contacto, push, consentimiento, preferencias, derechos y Wallet; imágenes con redirección canónica | 10 peticiones pasan y la 11.ª recibe 429 con `Retry-After`; contador en `rate_limits` |
| 5 | **Hecho.** Migración 0025 (comprobación de solo lectura) y borrado desde el servidor, solo de archivados sin historial | Un programa de prueba: sin botón mientras está activo, con nombre mal escrito se rechaza, con el correcto se elimina y queda auditado |

Cambios respecto al diseño original:
- **5:** `apply_migration` rechazó una función con `delete from`, así que la base solo
  expone `program_delete_summary` y el borrado lo ejecuta el servidor (service_role),
  condicionado a `status = 'archived'`. Las FK `restrict` siguen impidiendo perder historial.
- **1:** la 0023 original incluía `drop function`; se reemplazó por una versión aditiva.
- **2:** pendientes las reglas de Firewall de Vercel y el anti-bot (Turnstile).

## 0. Resumen y orden de ejecución

| # | Punto | Estado real hoy | Prioridad | Esfuerzo |
|---|-------|-----------------|-----------|----------|
| 1 | Correo ya registrado + programa nuevo | **Código listo y desplegado (#75), pero la migración 0023 NO está aplicada en producción**, así que el selector no aparece | P0 | S (aplicar + verificar) |
| 4 | Rectángulos negros ilegibles | Causa identificada: variantes `dark:` de Tailwind sobre una página de fondo claro | P0 | S (1 archivo + QA) |
| 2 | Rate limit | Solo cubre el alta por QR y las solicitudes de derechos; el resto de endpoints públicos no tiene límite | P1 | M |
| 3 | Límites de gasto Supabase y Vercel | Sin configurar (es configuración en paneles + guardas en la app) | P1 | S (config) + S (guardas) |
| 5 | Eliminar programas | Solo existe "Archivar"; el borrado necesita reglas por el ledger inmutable | P2 | M |

Orden recomendado: **1 → 4 → 3 → 2 → 5**. El 1 y el 4 desbloquean problemas visibles ya;
el 3 es configuración sin código y protege la factura mientras se construye el 2.

Hallazgos extra (sección 7): captura con datos personales reales dentro del repo, y la ruta
"Google Wallet" que ahora hace una llamada a Google por cada pulsación.

---

## 1. Correo ya registrado y acceso a un programa nuevo

### Lo que se verificó
- El PR #75 (`fix(join): multi-programa en el autorregistro por QR`) ya está en `main` y
  desplegado: la página `/join/[token]` muestra casillas de programas si `resolve_join`
  devuelve `programs`, y `register/route.ts` reenvía **solo** las tarjetas de los programas
  marcados (`card_delivery`) y crea las que falten.
- La migración `20261023000023_join_multi_program.sql` (que hace que `resolve_join` devuelva
  `programs` y que `register_customer_via_join` acepte `p_program_ids` y cree cuenta + tarjeta
  para el programa nuevo de un cliente existente) **no figura en `list_migrations` de
  producción** (la última aplicada es `…000022_scan_card_points`).
- Confirmado en la base: la firma desplegada es
  `register_customer_via_join(text,text,text,text,boolean,text,text)`, sin `p_program_ids`.
- Consecuencia: el selector nunca se muestra y el comportamiento es el que describes (se
  reenvía la tarjeta anterior). **No está roto el registro**: el servidor solo envía
  `p_program_ids` cuando la página lo trae.

### Plan
1. Revisar el SQL de la migración 0023 (es `create or replace` de dos funciones; sin borrados)
   y confirmar que el job `sql` de CI pasó con sus pruebas e2e.
2. **Aplicar 0023 en producción** (requiere tu aprobación; se hace con `apply_migration`).
3. Verificar en producción con un comercio de dos programas:
   - correo nuevo → eliges 1 o 2 programas → recibe 1 o 2 tarjetas;
   - correo existente + programa nuevo → se crea la cuenta y la tarjeta, llega **solo** esa;
   - correo existente + programa que ya tiene → se reenvía su tarjeta (sin duplicar);
   - la respuesta de la página es la misma en todos los casos (no revela si el correo existía).
4. Mejora de UX (opcional, fase 2): botón **"Unirme a otro programa"** dentro de la tarjeta
   (`/t/[token]`), sin pedir el correo otra vez. Evita enumerar correos y es más cómodo.
5. Mejora de copy: la pantalla `done` debe decir qué tarjeta(s) se enviaron.

### Aceptación
- Los 4 escenarios del paso 3 pasan en producción y quedan como prueba e2e SQL.
- Un cliente puede tener tarjetas de varios programas del mismo comercio, cada una con su
  propio pase de Wallet.

---

## 2. Rate limit

### Estado actual (inventario)
| Superficie | Protección hoy |
|---|---|
| `/join/[token]/register` | **Sí**: 20 altas/hora por (comercio, hash IP+UA) en la RPC (`join_attempts`) + honeypot |
| `/t/[token]/rights` | Parcial: máx. 5 solicitudes abiertas por cliente |
| Login / registro / recuperar | Los límites propios de Supabase Auth (el código ya maneja `over_email_send_rate_limit`) |
| `/contacto` (envía correo con Resend) | Solo honeypot y longitudes: **se puede usar para quemar cuota de correo** |
| `/t/[token]/push`, `consent`, `prefs` | Ninguna |
| `/t/[token]/wallet/google` | Ninguna; cada pulsación llama a Google (crear + actualizar el pase) |
| `/wallet-img/card/[serial]`, `/wallet-img/hero/[orgId]` | Ninguna. Generan PNG con consultas a la base; la URL lleva `?v=`, así que quien cambie `v` evita la caché y fuerza un render nuevo cada vez |
| `/t/[token]/qr`, `/logo/[orgId]`, `/api/health` | Ninguna (baratas; con caché) |
| Acciones del panel (autenticadas) | Límites de negocio (campañas/mes, idempotencia en visitas); nada por usuario |

### Diseño propuesto (3 capas, sin proveedor nuevo)
1. **Borde (Vercel Firewall / WAF)**: reglas gruesas por IP sobre `/wallet-img/*`,
   `/t/*/wallet/*`, `/contacto` y `/join/*`. En Hobby hay 1 regla de rate limit por proyecto
   y hasta 3 reglas personalizadas; en Pro, 40 (ver fuentes). Es la defensa contra abuso de
   coste porque corta **antes** de ejecutar la función.
2. **Aplicación (limitador genérico en Postgres)**: función `check_rate_limit(p_key text,
   p_limit int, p_window interval)` `security definer`, con una tabla `rate_limits` (clave =
   hash, ventana, contador) y limpieza por el cron existente. Reutiliza el patrón de
   `join_attempts`, sin Redis ni servicios nuevos. Se usa solo en endpoints mutantes o caros.
3. **Anti-bot en formularios públicos**: Cloudflare Turnstile (o equivalente) en `/contacto`,
   `/signup` y el alta por QR cuando se supere un umbral.

| Endpoint | Clave | Límite inicial |
|---|---|---|
| `/contacto` | IP | 3 / hora |
| `/t/[token]/push` | token + IP | 10 / hora |
| `/t/[token]/wallet/google` | token | 6 / hora (y 1 refresco de pase por minuto) |
| `/t/[token]/consent`, `prefs` | token | 30 / hora |
| `/wallet-img/*` | IP | 60 / minuto en el borde |
| Login (panel) | email + IP | los de Supabase + Turnstile tras 5 fallos |

Para `/wallet-img/*` además: validar que `?v=` coincide con el hash esperado y responder 404
si no (así no se puede inflar la caché ni el cómputo), y mantener `Cache-Control: immutable`.

### Respuesta y registro
- Responder `429` con `Retry-After` y mensaje en español; no revelar el límite exacto.
- Contar (sin guardar IP en claro: solo hash, como hoy) cuántos 429 hay por ruta para detectar
  abuso.

### Aceptación
- Prueba automatizada por endpoint: N+1 peticiones → la última devuelve 429; la ventana se
  libera sola.
- Ráfaga de 200 peticiones a `/wallet-img/…?v=aleatorio` no genera más de X renders.
- El flujo normal de un cliente (registro, suscribirse a push, guardar en Wallet) no se ve
  afectado.

---

## 3. Límites de gasto en Supabase y Vercel

> Primero hay que confirmar **en qué plan está cada servicio** (los paneles lo muestran):
> las opciones cambian entre gratis/Hobby y Pro.

### Supabase
- El **Spend Cap** es un interruptor (no un presupuesto en dinero): impide cobrar excedentes
  de disco, egress, funciones edge, logs, usuarios activos, Realtime y almacenamiento. **No
  cubre el cómputo** (el mayor coste fijo), ni ramas, réplicas, dominio propio, IPv4, IOPS
  extra, Log Drains ni PITR.
- Con el cap activo y la cuota superada, el servicio se restringe hasta el siguiente ciclo y
  llega un aviso al correo de facturación.
- No ofrece presupuestos por concepto ni alertas por importe.

Plan:
1. Confirmar plan; en Pro, **activar Spend Cap** (Configuración de la organización → Billing →
   Cost Control).
2. Fijar el tamaño de cómputo mínimo suficiente; no activar réplicas ni ramas permanentes
   (las ramas temporales de Neon/Supabase usadas para pruebas se deben borrar al terminar).
3. Poner un recordatorio mensual para revisar *Usage* (egress y almacenamiento) y el correo de
   facturación a una cuenta que se lea.
4. Guardas en la app (barato y efectivo): caché de las imágenes del pase, límites del punto 2,
   `limits.*` por comercio (ya existen `push_campaigns_per_month` y `push_max_subscribers`; añadir
   máximo de clientes, tarjetas y pases según el plan de `docs/BILLING_PLAN.md`).

### Vercel
- **Spend Management** (Pro y Enterprise): fijas un importe mensual; puede **pausar los
  despliegues de producción** al alcanzarlo, enviar un **webhook** y avisar (web y correo al
  50 %, 75 % y 100 %; SMS al 100 %). La comprobación ocurre cada pocos minutos, así que se
  debe fijar el importe **por debajo** de lo que de verdad se tolera. Un proyecto pausado no se
  reanuda solo: hay que reanudarlo a mano. Solo propietarios y rol de facturación lo ven.
- En Hobby no existe esa función (el plan no cobra excedentes: al pasar los límites se
  restringe).

Plan:
1. Confirmar plan. En Pro: activar Spend Management con importe objetivo, **pausa activada** y
   webhook a un correo/canal; revisar el interruptor de pausa (la documentación y el changelog
   se contradicen sobre si viene activado por defecto).
2. Reducir lo que más puede disparar el coste: el cron ya es diario; poner `maxDuration` a las
   rutas que generan imágenes; asegurar caché `immutable` en `/wallet-img/*`; el `proxy.ts` se
   ejecuta en casi todas las rutas (llama a `auth.getUser()`): excluir `/wallet-img`, `/logo` y
   `/t/*/qr` del `matcher`.
3. Activar las reglas de Firewall del punto 2.

### Otros proveedores con coste
Resend (correos), Google Wallet API (cuotas) y Neon (si se sigue usando para pruebas): anotar
sus límites y alertas en `docs/BILLING_PLAN.md`.

### Aceptación
- Captura/registro de que Spend Cap (Supabase) y Spend Management con pausa y alerta (Vercel)
  están activos, con el importe elegido.
- Simulación de alerta: el webhook llega a quien debe.

---

## 4. Rectángulos negros ilegibles

### Causa (verificada en el código y la captura)
- Tailwind v4 activa las clases `dark:` según el modo oscuro del **teléfono**
  (`prefers-color-scheme`). `globals.css` no define ni un tema oscuro ni `color-scheme`, y el
  fondo de la página es claro fijo (`#f8fafc`).
- Resultado: las fichas con `dark:bg-neutral-800` (p. ej. la de estado "Activo" en
  `customers/page.tsx:157`) se vuelven casi negras mientras su texto sigue oscuro → rectángulo
  negro. Lo mismo pasa con el chip verde "marketing" (verde claro sobre verde pálido).
- Alcance: **~140 usos de `dark:` en 15 archivos del panel** (`customers`, `customers/[id]`,
  `settings`, `team`, `rights`, `campaigns`, `rewards`, `programs`, `join`, `analytics`,
  `locations`, `audit`, `color-picker`, `print-button`…). Las páginas del cliente (`/t/*`) y la
  landing no usan `dark:`.
- No encontré en el código elementos llamados literalmente "QR" o "Fruppy Club" con ese
  problema: la causa es global, así que el arreglo debe ser global. En la captura que adjuntas
  los afectados son las fichas "Activo" y "marketing" de Clientes.

### Plan
1. **Arreglo global inmediato** en `app/globals.css`: neutralizar el modo oscuro automático
   (`@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`) y declarar
   `:root { color-scheme: light; }` + `<meta name="color-scheme" content="light">`. Con eso
   todas las clases `dark:` quedan inertes en cualquier pantalla, incluida cualquiera que no
   conociéramos.
2. Componente único de ficha (`Badge` con tonos `neutral | success | warning | danger | info`)
   con contraste AA, y sustituir las fichas sueltas (estado, canal, rol, estado de sede/programa…).
3. Limpieza posterior: eliminar poco a poco las clases `dark:` muertas (no urgente).
4. Si se quiere un modo oscuro real: es un proyecto aparte (tokens oscuros + revisión de todo
   el panel); no mezclarlo con este arreglo.

### Aceptación
- Con el sistema en modo oscuro (Playwright `colorScheme: 'dark'`), ninguna pantalla del panel
  tiene un elemento de fondo oscuro sobre la página clara; texto ≥ 4.5:1 de contraste.
- Revisión visual móvil de Clientes, Programas, Equipo, Derechos, Configuración, QR/Registro y
  Analítica.

---

## 5. Eliminar programas (hoy solo "Archivar")

### Lo que impone el modelo de datos
- `loyalty_transactions` es **append-only** y apunta a `loyalty_accounts` con
  `on delete restrict`; los canjes (`redemptions`) también. Por eso un programa con historial
  **no puede ni debe borrarse** (regla del plan rector: ledger inmutable).
- Para un programa **sin historial**, borrar arrastra por `on delete cascade`: cuentas
  (`loyalty_accounts`), tarjetas (`customer_cards`), premios (`rewards`) y pases de Wallet
  (`wallet_passes`). Es decir, las tarjetas de esos clientes dejan de existir y el pase de
  Google quedaría huérfano si no se revoca antes.
- `authenticated` no tiene `DELETE` sobre `loyalty_programs`: hace falta una RPC.

### Diseño
- **RPC `delete_program(p_program_id)`** `security definer`, solo owner/admin:
  1. verifica que el programa es del comercio y está **archivado** (flujo en dos pasos:
     Archivar → Eliminar, evita borrar por error el programa vivo);
  2. rechaza si existe cualquier transacción o canje (mensaje: "Tiene historial: solo se puede
     archivar");
  3. rechaza si es el único programa activo del comercio (el alta por QR dejaría de funcionar);
  4. devuelve antes un **resumen** (clientes inscritos, tarjetas, premios, pases) para
     confirmar, y al ejecutar escribe `write_audit_log`.
- **Servidor** (`deleteProgram` en `lib/admin/actions.ts`): antes de llamar a la RPC, revocar
  los pases de Google/Apple de ese programa con el proveedor (`revokePass`), y tras borrar,
  limpiar las filas espejo.
- **UI** (`programs/page.tsx`): botón "Eliminar" solo en programas archivados; diálogo que
  muestra el resumen y pide escribir el nombre del programa; si tiene historial, el botón se
  sustituye por un texto "Tiene historial; permanece archivado".

### Pruebas
- SQL e2e: sin historial → borra y cascada correcta; con historial → rechazo; programa de otro
  comercio → rechazo; rol sin permiso → rechazo; último programa activo → rechazo.
- Playwright: archivar → eliminar con resumen; intento con historial.

### Aceptación
- Un programa creado por error y sin uso se puede eliminar del todo; uno con historial sigue
  archivable pero no eliminable; nunca quedan tarjetas ni pases huérfanos.

---

## 6. Riesgos y decisiones abiertas
- **Aplicar la migración 0023 en producción** (punto 1): es un cambio en la base real; lo hago
  cuando lo apruebes.
- **Planes de Vercel y Supabase**: no los puedo ver desde aquí; el punto 3 depende de ellos.
- **Turnstile / servicio anti-bot**: decidir si se acepta una dependencia externa para
  formularios públicos.
- **Eliminar con historial**: se decidió *no* permitirlo; si quieres un "ocultar" para limpiar
  la lista de archivados con historial, es una columna `hidden_at` aparte.
- **Modo oscuro**: este plan lo desactiva; ofrecerlo de verdad es otro proyecto.

## 7. Hallazgos adicionales
1. **Datos personales reales en el repositorio.** La carpeta `Muckup/` tiene 41 archivos
   versionados y la captura nueva (`WhatsApp Image 2026-10-24 at 9.07.17 PM.jpeg`, aún sin
   versionar) muestra **nombres, correos y teléfonos de clientes reales**. Además varios
   nombres de archivo usan el nombre de un comercio cliente, lo que contradice la regla de
   marca de `AGENTS.md`. Recomendación: no versionar esa captura, añadir `Muckup/` al
   `.gitignore` y revisar si las imágenes ya versionadas deben retirarse del historial.
2. **La ruta "Google Wallet" refresca el pase en cada pulsación** (cambio del PR #76). Es
   correcto para que el diseño se actualice, pero cada pulsación hace llamadas a Google: debe
   entrar en el limitador del punto 2 (1 refresco por minuto por tarjeta).
3. Archivo `nul` en la raíz del repositorio (artefacto de Windows): borrarlo.

## Fuentes
- Supabase — [Control your costs](https://supabase.com/docs/guides/platform/cost-control)
- Vercel — [Spend Management](https://vercel.com/docs/spend-management)
- Vercel — [WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
  y [rate limiting en Hobby](https://vercel.com/changelog/rate-limiting-now-available-on-hobby-with-higher-included-usage-on-pro)
