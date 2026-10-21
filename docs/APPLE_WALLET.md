# Apple Wallet — activación (QA-P1)

Estado: **código listo, desactivado**. `/t/<token>/wallet/apple` responde 404
mientras `APPLE_WALLET_ENABLED` no sea `true` o falten los certificados; la
tarjeta del cliente no muestra el botón de Apple (solo Google Wallet).

## Qué necesita el dueño de la cuenta

Requiere un **Apple Developer Program** (USD 99/año). Con él:

1. **Pass Type ID** (Certificates, Identifiers & Profiles → Identifiers →
   *Pass Type IDs*): p. ej. `pass.com.pineappleloyalty.loyalty`.
2. **Certificado de firma** del Pass Type ID (CSR → `.cer` → exportar `.p12` →
   convertir a PEM de certificado y de llave privada).
3. **Certificado WWDR** (Apple Worldwide Developer Relations, G4) en PEM.
4. **Team ID** (Membership → Team ID).

## Variables de entorno (Vercel → Production)

| Variable | Valor |
|---|---|
| `APPLE_WALLET_ENABLED` | `true` |
| `APPLE_PASS_TYPE_ID` | el Pass Type ID |
| `APPLE_TEAM_ID` | el Team ID |
| `APPLE_WWDR_PEM` | contenido del WWDR en PEM (en Vercel no hay disco: usar PEM en variable, no `*_PATH`) |
| `APPLE_PASS_CERT_PEM` | certificado de firma PEM |
| `APPLE_PASS_KEY_PEM` | llave privada PEM |
| `APPLE_PASS_KEY_PASSWORD` | solo si la llave tiene contraseña |

Los nombres exactos que lee el provider están en `apps/web/lib/wallet/passlet.ts`
(`appleEnabled()`); `apps/web/tests/wallet.test.ts` cubre los casos "sin
credenciales".

## Verificación

1. Con las variables puestas, abrir `/t/<token>/tarjeta` desde un iPhone: debe
   aparecer "Añadir a Apple Wallet" y descargar `tarjeta-fidelidad.pkpass`.
2. Revocar la tarjeta desde el panel y comprobar que el pase se actualiza.
3. Nunca commitear certificados ni llaves (`.gitignore` ya excluye `*.pem`,
   `*.p12`).
