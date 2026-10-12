# Plan — Multi-tenant neutro del SaaS

Objetivo: que una segunda organización pueda usar la plataforma sin rastro
de "Fruppy" en correos, URLs ni pases de Wallet.

Decisiones tomadas (aprobado por el propietario):

- **Consola Wallet**: issuer neutro del SaaS (no issuer por comercio, por ahora).
- **Clase del pase**: una clase por org con su propio branding.
- **Email**: remitente neutro `"{Org}" <tarjetas@DOMINIO_SAAS>`.
- **Dominio/DNS**: Cloudflare Registrar + DNS (precio de costo ~$10.44/año
  .com, sin recargo en renovaciones; Email Routing gratis para recibir
  respuestas en `tarjetas@DOMINIO` reenviadas al Gmail del dueño).
- **Hosting**: se queda en Vercel (misma cuenta, N dominios por proyecto,
  gratis). NO migrar a Cloudflare Pages/Workers: exigiría runtime edge +
  OpenNext para ganar $0.
- `fidelizacion-fruppy.vercel.app` se conserva adjunto → los links de
  tarjeta ya emitidos siguen funcionando.

## Costos

| Ítem | Costo |
|---|---|
| Dominio (.com) en Cloudflare Registrar | ~$10.44 USD/año |
| Issuer Wallet adicional | $0 |
| Resend free tier | $0 (hasta 3.000 emails/mes) |
| Vercel dominio custom | $0 |
| Cloudflare DNS + Email Routing | $0 |
| **Total** | **~$0.87 USD/mes** |

Alternativa $0 descartada: Gmail SMTP con cuenta neutra — "via gmail.com",
sin DKIM propio, límite 500/día y no resuelve la URL fruppy-brandeada.

## Fase 0 — Dominio y cuentas (manual, ~1 h)

- [ ] Comprar dominio neutro en Cloudflare Registrar (~$10.44/año).
      Candidatos a verificar disponibilidad:
      `fideliza.app`, `tarjetafidelidad.com`, `puntosya.app`, `lealtya.com`
      (evitar .xyz/.site por reputación de spam en correo transaccional).
- [ ] Adjuntar dominio al proyecto en Vercel (Settings → Domains) con
      Cloudflare DNS en modo DNS-only (nube gris, sin proxy).
- [ ] Verificar dominio en Resend: DKIM (TXT), SPF (TXT) y DMARC inicial
      `v=DMARC1; p=none;` — endurecer a `quarantine`/`reject` después.
- [ ] Opcional: Cloudflare Email Routing → `tarjetas@DOMINIO` reenvía a
      `eduardosamsungnote9@gmail.com` (buzón de respuestas gratis).
- [ ] Crear issuer neutro "Fidelización" en Google Pay & Wallet Console
      (cuenta `eduardosamsungnote9@gmail.com`) → anotar `ISSUER_ID_NEUTRO`.
- [ ] Autorizar `wallet-issuer@fruppy-wallet.iam.gserviceaccount.com`
      como Desarrollador en el issuer neutro.

## Fase 1 — Migración DB (`supabase/migrations/2026MMDD_multitenant_wallet.sql`)

- [ ] `organizations`:
      + `google_issuer_id text` — null = wallet deshabilitada para la org
      + `wallet_class_id text` — default `'loyalty-' || slug`
      + `brand_color text` — default `'#0d9488'`
      + `wallet_logo_url text`, `wallet_hero_url text` — null = assets
        genéricos del SaaS
- [ ] Backfill Fruppy: `google_issuer_id = ISSUER_ID_NEUTRO`,
      `wallet_class_id = 'loyalty-fruppy'`, logo/hero a los assets actuales.
      Los pases ya guardados bajo el issuer viejo **siguen funcionando**;
      los nuevos se emiten bajo el issuer neutro.
- [ ] Tests SQL E2E (`supabase/tests/e2e_loyalty.sql`): org sin issuer →
      wallet deshabilitado; dos orgs → class_ids distintos; RLS intacto
      (nadie lee campos wallet de otra org).

## Fase 2 — Código Wallet (`apps/web/lib/wallet/`)

- [ ] `pass-data.ts`: SELECT incluye
      `organizations(google_issuer_id, wallet_class_id, brand_color,
      wallet_logo_url, wallet_hero_url)`; `WalletPassData` gana
      `issuerId`, `classId`, `brandColor`, `logoUrl`, `heroUrl`.
- [ ] `passlet.ts`:
      - `getWallet(issuerId)` → `Map<string, Wallet>` cacheado por issuer
        (hoy un solo issuer neutro; diseño listo para issuer-por-org).
      - `templateOf`: `id: data.classId`, `color: data.brandColor`,
        logo/hero desde `data.logoUrl`/`heroUrl` con fallback a assets
        genéricos del SaaS en `/brand/saas/`.
      - `issuerName` = `data.orgName` (correcto: nombre visible del
        comercio; la entidad emisora es el issuer neutro).
- [ ] `push.ts`/`sync.ts`: sin cambios estructurales (`load()` ya re-lee
      por serial → resuelve org → issuer).
- [ ] `.env`: `GOOGLE_WALLET_ISSUER_ID` pasa a fallback legacy; prioridad
      al valor por org en DB.
- [ ] Tests unitarios: dos orgs → class_id e issuer resueltos por org;
      org sin issuer → `WalletNotConfiguredError` controlado.

## Fase 3 — Email neutro (`lib/loyalty/actions.ts` + Supabase Auth)

- [ ] `.env`/Vercel: `EMAIL_DOMAIN=tarjetas@DOMINIO` →
      `from = \`${orgName} <tarjetas@${EMAIL_DOMAIN}>\``.
      El display name con el nombre de la org no requiere verificación
      extra — solo el dominio.
- [ ] Plantilla HTML: quitar `Powered by Fruppy` →
      `Powered by {Marca SaaS}` (nombre del producto).
- [ ] Supabase Auth SMTP (dashboard): remitente de
      `info@fruppyhelados.com` al dominio neutro — los correos de
      login/invitación también son transversales al SaaS.
- [ ] `EMAIL_FROM` viejo queda solo como fallback de dev.

## Fase 4 — URL pública neutra

- [ ] `NEXT_PUBLIC_BASE_URL=https://DOMINIO_SAAS` en Vercel
      (Production + Preview) y `.env.local`. Afecta: links de tarjeta,
      QR, Save URLs y URLs de imágenes en las clases Wallet.
- [ ] Re-publicar clase(s) Google con las nuevas URLs de logo/hero
      (PUT a la API, mismo procedimiento del `?v=2` → bump a `?v=3`).
- [ ] Verificar links viejos (`*.vercel.app`) — Vercel sirve ambos
      dominios; no hace falta redirect manual.

## Fase 5 — Widget Wallet en el panel del comercio

El comercio no tiene acceso a la consola de Google (issuer del SaaS): su
vista de Wallet vive en su propio dashboard, alimentada por
`wallet_passes` (ya org-scoped por RLS — cero migración extra).

- [ ] `Inicio` (`/dashboard/{org}`): tarjeta "Google Wallet" con
      pases activos (`count where status='active'`), % adopción
      (activos / clientes activos) y fecha del último emitido.
- [ ] Ficha de cliente (`/dashboard/{org}/customers/[id]`): badge
      "En Wallet" + fecha de emisión; solo visible si la org tiene
      `google_issuer_id` configurado (org sin wallet = sin sección).
- [ ] Solo lectura: el comercio ve métricas, nunca internals de Google
      ni clases de otras orgs. Queries nuevas: 2 counts head-only +
      1 select en ficha — baratas, sin índices nuevos
      (`wallet_passes_org_idx` ya existe).

## Fase 6 — Verificación y cierre

- [ ] `lint`/`typecheck`/`test`/`build` + E2E SQL en rama Neon
      (39 tests actuales + nuevos de wallet multi-org).
- [ ] Org de prueba "Demo Org": cliente recibe correo como
      `"Demo Org" <tarjetas@DOMINIO>`, tarjeta en dominio neutro,
      pase con clase `loyalty-demo-org` y logo genérico — cero mención
      a Fruppy en ninguna parte.
- [ ] Checklist vía `scripts/checklist.py`; decisión documentada en
      `docs/DECISIONS.md`.

## Fuera de alcance (futuro)

- Issuer Wallet POR comercio (el `Map<issuerId, Wallet>` ya lo admite —
  solo requiere que cada comercio cree su issuer y autorice la service
  account, sin cambios de código).
- Dominio de email propio por org (verificación DNS por cliente — premium).
- Upload de branding desde el dashboard (Supabase Storage).
- Rotar API key de Resend (pendiente de seguridad previo — hacerlo en
  Fase 3 cuando se toque el remitente).
