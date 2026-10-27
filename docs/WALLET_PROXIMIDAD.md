# Proximidad y campañas en Google Wallet

## Cómo funciona

- **Sedes → pase.** Con `features.wallet_proximity = true` (Configuración →
  Privacidad y funciones), las sedes **activas con coordenadas válidas** se
  publican como `merchantLocations` en la clase `loyalty-{orgId}` de Google
  Wallet. Máximo 10 por clase; Google solo admite latitud/longitud (el texto
  del aviso lo define Google; `relevantText` solo lo usa Apple).
- **Sincronización.** Crear/editar/activar/desactivar una sede, o cambiar la
  bandera, republica la clase (`syncWalletLocations`). «Sincronizar con
  Wallet» en `/dashboard/[org]/locations` reintenta a mano. Si el comercio no
  tiene pases emitidos, la clase se crea con las sedes al emitir el primero.
- **Privacidad.** Pineapple Loyalty no conoce ni guarda la posición del
  titular. Google decide si y cuándo avisar según los permisos y ajustes del
  teléfono; no se puede forzar ni verificar desde el servidor.
- **Sedes cercanas (cliente).** `/t/[token]/sedes` ordena por distancia con la
  geolocalización del navegador, solo tras un clic, calculada en el
  dispositivo y sin persistirse. Requiere `features.location`.

## Campañas

- Variables: `{nombre}` y `{negocio}`, resueltas por destinatario (push y
  pase). Variable sin valor → texto alternativo; desconocida → se elimina.
- `push_campaigns.stats.wallet` guarda `{notified, textOnly, limited, failed}`.
- Cuota de Google: 3 avisos por pase cada 24 h; luego se degrada a TEXT.

## Verificación manual

1. Activar la bandera, crear una sede con coordenadas.
2. Comprobar la clase: `GET walletobjects/v1/loyaltyClass/{issuer}.loyalty-{orgId}`
   debe traer `merchantLocations`.
3. Desactivar la sede → `merchantLocations` desaparece.
4. Lo que **solo se valida en un teléfono**: que el pase muestre el aviso de
   proximidad (depende de Google y de los permisos del titular).

## Desactivación rápida

Quitar `wallet_proximity` en Configuración (retira las sedes de la clase) o
`PUSH_ENABLED=false` / `GOOGLE_WALLET_ENABLED=false` en el entorno.
