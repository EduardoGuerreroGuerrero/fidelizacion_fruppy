# Correo de autenticación (Supabase Auth) — SMTP propio y plantillas

> **Estado (21/10/2026): no se aplica.** El dueño mantiene el remitente actual
> `notificaciones@pineappleloyalty.com`, ya configurado y desplegado. Este documento
> queda solo como referencia si el correo de confirmación vuelve a caer en spam.

> Resuelve **QA-A12**: el correo de confirmación de cuenta llegaba a "Correo no
> deseado". Es una configuración del **panel de Supabase** (no vive en el repo):
> requiere que el dueño del proyecto la aplique.

## Por qué cae en spam

- Supabase Auth envía por defecto desde un remitente compartido
  (`noreply@mail.app.supabase.io`): reputación compartida, límite bajo de
  correos/hora y sin relación con tu dominio.
- Los correos *transaccionales de la app* (tarjeta, invitaciones, derechos) ya
  salen por **Resend** con el dominio `pineappleloyalty.com` **verificado**
  (comprobado: `sending: enabled`). Falta que Auth use el mismo canal.

## Pasos (≈10 min)

1. **Supabase → Authentication → Emails → SMTP Settings → Enable custom SMTP**
   | Campo | Valor |
   |---|---|
   | Sender email | `no-reply@pineappleloyalty.com` |
   | Sender name | `PineappleLoyalty` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | una **API key de Resend** con permiso *Sending access* (créala solo para esto; no reutilices la del servidor) |
2. **Supabase → Authentication → Emails → Templates**: pega las plantillas de
   [`docs/supabase-email-templates/`](supabase-email-templates/) (confirmación y
   recuperación, en español, con marca).
3. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://www.pineappleloyalty.com`
   - Redirect URLs: `https://www.pineappleloyalty.com/auth/callback`,
     `http://localhost:3000/auth/callback` (y la de los *previews* de Vercel si
     se prueban ahí).
4. **Límite de envío**: *Authentication → Rate Limits → Emails per hour*: súbelo
   (p. ej. 30/h) ahora que el SMTP es propio.
5. **DNS** (opcional, recomendado): el DMARC actual es `p=none`
   (`v=DMARC1; p=none; rua=mailto:soporte@pineappleloyalty.com`). Tras unas
   semanas sin reportes de fallo, subir a `p=quarantine`.

## Cómo verificar

1. Registra una cuenta nueva con un Outlook/Gmail real: el correo debe llegar a
   la **bandeja principal**, remitente `PineappleLoyalty <no-reply@pineappleloyalty.com>`.
2. Pega el correo en <https://www.mail-tester.com> (objetivo ≥ 9/10).
3. En `/login` → "¿Olvidaste tu contraseña?" → llega el enlace de recuperación
   y abre `/nueva-clave` (en el mismo navegador donde se pidió: PKCE).

## Notas

- La confirmación de correo **se mantiene activa** (decisión del producto).
- El enlace de confirmación y el de recuperación usan PKCE: deben abrirse en el
  **mismo navegador** donde se hizo el registro / la solicitud. Si no, la app
  explica qué hacer (`/login` o `/recuperar` con aviso).
