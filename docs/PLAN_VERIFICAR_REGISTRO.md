# Plan: verificar el flujo de registro con confirmación de email

Para ejecutar con otro agente que tenga el MCP de Playwright (`.mcp.json` en la raíz).
Responder al usuario siempre en español.

## Contexto

Bug original: tras registrarse, el usuario llegaba a `/login` y no podía entrar
("Credenciales incorrectas"). Causa: Supabase hosted tiene "Confirm email"
activo, `signUp` no devuelve sesión y la action redirigía a `/dashboard`
(el proxy rebota a `/login`; el login falla con `email_not_confirmed`).

Ya corregido en el working tree (sin commit):

- `apps/web/lib/auth/actions.ts`: `signUp` usa `emailRedirectTo` →
  `/auth/callback`, detecta email ya registrado (`identities` vacío), y si no
  hay sesión redirige a `/login?notice=…`. `signIn` distingue
  `email_not_confirmed`.
- `apps/web/app/(auth)/login/page.tsx`: muestra `notice`.
- `apps/web/app/auth/callback/route.ts`: mensaje de error genérico.

Decisiones del usuario (no cambiar):

- La confirmación de email SE MANTIENE activa.
- La confirma el propio usuario desde su correo. El agente NO confirma cuentas
  (ni desde Supabase Auth → Users, ni con service role, ni con endpoints admin).

## Prerrequisitos

1. MCP `playwright` conectado (`/mcp`). Si no aparece, parar y avisar.
2. Preguntar al usuario qué correo usar para la prueba. No inventar uno.
3. Env en `apps/web/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No imprimir sus valores.
4. Aviso al usuario: el registro usa el Supabase real y envía un correo real.
5. Supabase → Auth → URL Configuration: `http://localhost:3000/auth/callback`
   (y la URL de producción) deben estar en Redirect URLs. Si no, pedírselo al
   usuario; sin eso el enlace del correo no vuelve a la app.

## Pasos

1. Rama: `git switch -c fix/signup-email-confirmation` (no trabajar en `main`;
   la rama actual `feat/landing-impeccable-polish` es de otro tema).
2. Verificación estática, desde la raíz:
   `npm run lint && npm run typecheck && npm run test && npm run build`.
3. `npm run dev` en segundo plano; esperar a `http://localhost:3000`.
4. Con Playwright MCP, ir a `/signup` y llenar: nombre, correo del usuario,
   contraseña (≥ 8), negocio, tipo, país, ciudad, marcar términos. Enviar.
   - Esperado: URL `/login?notice=…` con el aviso "Te enviamos un correo de
     confirmación…". NO debe llegar a `/dashboard`.
5. Intentar login con esas credenciales sin confirmar.
   - Esperado: "Debes confirmar tu correo antes de iniciar sesión…", no
     "Credenciales incorrectas".
6. Registrar de nuevo el mismo correo.
   - Esperado: "Ese email ya está registrado. Inicia sesión."
7. PAUSA: pedir al usuario que abra el correo y pulse el enlace de
   confirmación. Esperar su confirmación explícita.
   - Nota: el flujo PKCE exige abrir el enlace en el MISMO navegador donde se
     hizo el registro (cookie del code verifier). Si el usuario lo abre en otro,
     `/auth/callback` falla y manda a `/login` con error; ahí el login normal
     ya debe funcionar porque el correo quedó confirmado. Verificar ambos casos
     si es posible.
8. Login con las mismas credenciales.
   - Esperado: entra a `/dashboard`; se crea o selecciona la organización
     (ver `apps/web/app/dashboard/[org]/layout.tsx`, usa `user_metadata`).
9. Capturar screenshots de cada estado y revisar la consola del navegador.

## Criterios de aceptación

- Pasos 4, 5, 6 y 8 se comportan como se indica.
- Ninguna cuenta se confirmó por medios distintos al enlace del correo.
- lint, typecheck, test y build en verde.
- Sin secretos en logs, commits ni capturas.

## Si algo falla

- Correo no llega: revisar spam; en Supabase → Auth → Logs ver el envío. El
  SMTP por defecto de Supabase tiene límite bajo de correos/hora. Si es el
  caso, informar al usuario; no saltarse la confirmación.
- Callback falla: revisar Redirect URLs (prerrequisito 5).
- Error tras confirmar en `/dashboard`: revisar el provisioning de la
  organización con el usuario nuevo (RLS y migraciones en `supabase/migrations`).
  Probar migraciones solo en ramas temporales de Neon.

## Cierre

1. Si todo pasa, commit en la rama (mensajes en español, estilo del repo) con
   `.mcp.json` solo si el usuario lo aprueba.
2. PR hacia `main` (checks `build` + `sql` obligatorios; sin push directo).
   `gh` portable en `%LOCALAPPDATA%\gh-cli\bin\gh.exe` con `GH_TOKEN` del
   Credential Manager.
3. Reportar resultados fielmente: qué pasó, qué se omitió y por qué.
