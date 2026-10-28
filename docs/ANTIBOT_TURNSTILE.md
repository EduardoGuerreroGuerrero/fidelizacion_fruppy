# Anti-bot en formularios públicos (Cloudflare Turnstile)

## Dónde se aplica
| Formulario | Validación en servidor |
|---|---|
| `/contacto` | `lib/contact/actions.ts` |
| `/signup` | `signUp` en `lib/auth/actions.ts` |
| `/recuperar` | `requestPasswordReset` en `lib/auth/actions.ts` |
| Alta por QR `/join/[token]` | `app/join/[token]/register/route.ts` |

El login no lleva Turnstile: Supabase Auth ya limita los intentos y añadirlo
estorba al equipo que entra a diario. Se puede añadir `<Turnstile />` al formulario y
`verifyAntiBot` a `signIn` si se detecta abuso.

## Cómo funciona
- `app/_components/turnstile.tsx` pinta el widget (render explícito) y el widget añade el
  campo oculto `cf-turnstile-response` al formulario.
- `lib/antibot.ts` valida ese token contra `siteverify` de Cloudflare antes de hacer nada.
- Capas que siguen activas: honeypot, rate limit (`lib/ratelimit.ts`) y los límites de
  Supabase Auth.

## Se activa solo con claves
Sin `NEXT_PUBLIC_TURNSTILE_SITE_KEY` **y** `TURNSTILE_SECRET_KEY` el anti-bot es un no-op
(no se muestra nada y no se bloquea nada). Con ambas:
- token ausente o rechazado → se bloquea con un mensaje en español;
- Cloudflare caído o con error HTTP → **se deja pasar** (falla abierta) y se registra:
  una caída de un tercero no debe dejar fuera a los clientes; el rate limit sigue activo.

## Activarlo en producción (manual)
1. Cloudflare → Turnstile → *Add widget*: dominio `pineappleloyalty.com` (y `www`),
   modo *Managed*. Copiar *Site key* y *Secret key*.
2. Vercel → Settings → Environment Variables (Production y Preview):
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.
3. Redesplegar (la clave pública se incrusta en el build).
4. Comprobar `/contacto`: debe aparecer la casilla y el envío debe funcionar.

## Probar en local
Claves de prueba oficiales de Cloudflare:
- Siempre pasa: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
- Siempre bloquea: site `2x00000000000000000000AB`, secret `2x0000000000000000000000000000000AA`.
