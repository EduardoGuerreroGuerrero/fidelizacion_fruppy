# Auditoría de seguridad — PineappleLoyalty · 2026-10-26

Revisión de seguridad de la aplicación web (`apps/web`) y la capa de datos
(`supabase/migrations`), realizada en **modo offline** (análisis estático del
código del propio repositorio, sin tráfico contra entornos vivos) usando la
metodología OWASP Top 10 / OWASP API Security Top 10.

- **Alcance:** `apps/web` (App Router, Route Handlers, Server Actions, proxy,
  config) + `supabase/migrations` (RLS, RPCs, grants).
- **Modo:** offline / static review. Ningún resultado simulado se presenta como
  evidencia viva.
- **Herramienta de apoyo:** colección *Claude-Code-CyberSecurity-Skill* (skill
  `cyber-web-security`), instalada en `~/.claude/skills/`.

---

## 1. Resumen ejecutivo

La base de código es **sólida en seguridad** y aplica de forma consistente las
12 reglas del documento rector (multi-tenancy, ledger inmutable, servidor como
frontera de confianza, no exponer secretos). No se encontró ninguna
vulnerabilidad crítica ni alta. Los hallazgos son de **endurecimiento**
(hardening) y de **higiene del repositorio**.

| Severidad | Nº |
|-----------|----|
| Crítica   | 0  |
| Alta      | 0  |
| Media     | 2  |
| Baja      | 3  |
| Info      | 2  |

### Fortalezas verificadas (evidencia observada)

- **RLS activo en las 21 tablas** (`enable row level security` = 21/21).
- **Todas las RPCs `SECURITY DEFINER` fijan `set search_path = ''`** — sin
  vector de secuestro de `search_path`. (61 menciones en migraciones; las
  aparentes "faltantes" son comentarios, no definiciones.)
- **Tokens de tarjeta validados** con `^[a-f0-9]{32}$` en cada Route Handler
  público antes de tocar la base de datos.
- **Multi-tenancy en servidor:** el `organization_id` nunca llega desde el
  cliente; el token o la membresía activa lo resuelven en servidor
  (`register_customer_via_join`, export de clientes con doble chequeo de
  membresía `active`).
- **Anti CSV-formula-injection** en la exportación de clientes
  (`csvCell`, prefijo `'` para `= + - @`), con BOM UTF-8 y `Cache-Control:
  no-store`.
- **Alta pública endurecida:** honeypot (`empresa`), rate-limit por hash
  IP+UA (la IP **nunca** se almacena en claro), consentimiento obligatorio,
  idempotencia.
- **`service_role` acotado** a código de servidor confiable
  (`supabaseAdmin()`), con advertencia explícita en el cliente navegador que
  solo usa la `anon key` (RLS como frontera).
- **Cron protegido** por `CRON_SECRET` Bearer; en producción sin secreto
  responde `503` en lugar de ejecutarse abierto.
- **`npm audit --omit=dev`: 0 vulnerabilidades.** Sin secretos en el árbol de
  código; `.env*` correctamente ignorado; solo `.env.example` versionado.
- **Cabeceras base presentes:** `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
  restrictiva (cámara/geo solo `self`; micrófono/pagos/usb deshabilitados).

---

## 2. Hallazgos

### SEC-01 — CSP en modo *Report-Only* (Media)

- **OWASP:** A05 Security Misconfiguration · **CWE-693** Protection Mechanism
  Failure.
- **Observado:** `apps/web/next.config.ts` emite
  `Content-Security-Policy-Report-Only`, no la cabecera de cumplimiento. La
  política además incluye `script-src 'unsafe-inline'`.
- **Impacto:** ante un XSS, la CSP no bloquea nada en producción; solo reporta.
  `'unsafe-inline'` debilita la política incluso si se forzara.
- **Decisión (riesgo aceptado, documentada):** **no** se fuerza la CSP en esta
  entrega. Forzarla con `'unsafe-inline'` presente aporta poca protección real
  y arriesga romper producción (Next inyecta scripts/estilos en línea sin
  nonce). El camino correcto es una migración a CSP con **nonce**, fuera del
  alcance de un cambio seguro de cabeceras. Queda como trabajo de seguimiento
  (ver §4).

### SEC-02 — Falta cabecera HSTS (Media)

- **OWASP:** A02 Cryptographic Failures · **CWE-319** Cleartext Transmission.
- **Observado:** `securityHeaders` no incluye `Strict-Transport-Security`.
- **Impacto:** sin HSTS explícito, un cliente podría ser degradado a HTTP en la
  primera conexión (SSL-strip). Vercel sirve HTTPS, pero la cabecera no está
  garantizada a nivel de app.
- **Remediación (aplicada):** añadir
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

### SEC-03 — Faltan cabeceras de aislamiento / hardening (Baja)

- **OWASP:** A05 Security Misconfiguration.
- **Observado:** sin `Cross-Origin-Opener-Policy`,
  `X-Permitted-Cross-Domain-Policies` ni `X-DNS-Prefetch-Control`.
- **Remediación (aplicada):** `Cross-Origin-Opener-Policy: same-origin`,
  `X-Permitted-Cross-Domain-Policies: none`, `X-DNS-Prefetch-Control: off`.
  No se añade COEP/CORP para no romper la carga de imágenes `https:`/`data:`
  del pase y los logos.

### SEC-04 — Archivo basura `nul` en la raíz (Baja / higiene)

- **Observado:** archivo `nul` (75 bytes) con un mensaje de error de `cmd.exe`
  ("no se pudo encontrar ningún archivo…") — artefacto de una redirección a
  `NUL` mal escrita en PowerShell/cmd. No está en `.gitignore`.
- **Impacto:** ruido en el árbol; en Windows `nul` es un nombre de dispositivo
  reservado y puede causar fricción en operaciones de archivos.
- **Remediación (aplicada):** eliminar el archivo y añadir `nul` a `.gitignore`.

### SEC-05 — Tablas sin `FORCE ROW LEVEL SECURITY` (Baja / informativo)

- **Observado:** las tablas activan RLS pero no `FORCE`.
- **Análisis — anti-recomendación:** **NO** debe aplicarse `FORCE RLS** aquí.
  Las operaciones privilegiadas pasan por RPCs `SECURITY DEFINER` que corren
  como el *owner* y **dependen** de saltarse RLS dentro de la función (patrón
  intencional, con `search_path=''`). `FORCE RLS` sometería también al owner a
  las policies y **rompería esas RPCs**. Los roles de la API (`anon`,
  `authenticated`) no son owners, así que RLS ya se les aplica. Se documenta
  para evitar que una "mejora" futura lo introduzca por error.

### SEC-06 — Endpoint push influenciable por token (Informativo)

- **OWASP:** A10/API7 SSRF-adjacente.
- **Observado:** `upsert_push_subscription` registra el `endpoint` de la
  suscripción ligado al token de tarjeta; `web-push` hace POST a ese endpoint.
- **Análisis:** comportamiento estándar de Web Push (el endpoint es del servicio
  push del navegador). El token de tarjeta es la credencial y la elegibilidad
  se re-evalúa al enviar. Riesgo bajo; se recomienda mantener límite de
  suscripciones por tarjeta (ya acotado en la RPC) y no seguir redirects.

### SEC-07 — Redirect del logo a URL almacenada (Informativo)

- **Observado:** `app/logo/[orgId]/route.ts` hace `redirect(logoUrl)` cuando
  `brand.logo_url` es `https://…`.
- **Análisis:** el valor solo lo fija un admin de la org (dato ya público en el
  QR/join) y exige prefijo `^https://`. No es open-redirect explotable por un
  tercero. Sin acción.

---

## 3. Plan de mejora — ejecución

Cambios **aplicados** en esta entrega (seguros, sin tocar el esquema; pasan
`build`; no requieren el check `sql`):

- [x] **SEC-02** HSTS en `next.config.ts`.
- [x] **SEC-03** COOP + `X-Permitted-Cross-Domain-Policies` + `X-DNS-Prefetch-Control`.
- [x] **SEC-04** eliminar `nul` y añadirlo a `.gitignore`.
- [x] **SEC-01 / SEC-05 / SEC-06 / SEC-07** documentados (decisión / anti-recomendación / aceptados).

Verificación: `npm run lint && npm run typecheck && npm run build` en verde.

---

## 4. Trabajo de seguimiento recomendado (fuera de alcance de esta entrega)

1. **CSP con nonce (SEC-01):** introducir nonce por request en los scripts de
   Next y pasar de `Report-Only` a cumplimiento, eliminando `'unsafe-inline'`
   de `script-src`. Requiere cambios de runtime y pruebas E2E.
2. **Monitorizar reportes CSP** antes del punto 1 (endpoint `report-to`).
3. **Pruebas automatizadas de cabeceras:** añadir un test que verifique la
   presencia de HSTS/COOP/CSP en la respuesta, para evitar regresiones.
