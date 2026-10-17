# Guía de generación de contenido — Sección "Recursos" de PineappleLoyalty

Todo el contenido se puede generar con IA. Esta guía contiene: el kit de marca,
los prompts de imagen, los prompts/guiones de video, las plantillas de texto y
las convenciones de archivos para integrar el contenido a la web.

> **Regla de oro** (del plan de la landing): no anunciar nada que el producto no
> haga. Todo el contenido se limita a las funciones reales verificadas:
> programa de puntos o sellos, registro por QR, tarjeta en Google Wallet,
> notificaciones push, multi-sede, campañas por segmento y reportes.
> **No mencionar Apple Wallet.**

---

## 1. Kit de marca (referencia para todos los prompts)

| Elemento | Valor |
|---|---|
| Verde oscuro | `#0F5132` |
| Verde brillante | `#22C55E` |
| Amarillo piña | `#FBBF24` |
| Crema | `#FEF3C7` |
| Marfil fondo | `#FDFAF0` |
| Texto | `#0F172A` |
| Tipografías | Poppins (texto), Caveat (notas manuscritas) |
| Isotipo | `apps/web/public/pineapple/isotipo-trans.png` |
| Logo horizontal | `apps/web/public/pineapple/logo.png` |
| Logo vertical | `apps/web/public/pineapple/logo-vertical.png` |

**Estilo visual consistente**: flat illustration / 3D suave, fondos crema,
hojas tropicales de piña como elemento decorativo, helado/cono como metáfora
del comercio de ejemplo "Fruppy Helados". Estilo amigable, redondeado, sin
fotos de stock genéricas de oficina.

**Comercio ficticio oficial**: "Fruppy Helados" (heladería, Barranquilla,
Colombia). Usarlo SIEMPRE como ejemplo en guías, videos y capturas.

---

## 2. Inventario de contenido a generar

| # | Contenido | Tipo | Destino en la web |
|---|---|---|---|
| 1 | 4 miniaturas de "Recursos destacados" | Imagen | `/recursos` + landing |
| 2 | Guía: configurar tu programa | Texto → MD/PDF | `/recursos/guias/configurar-programa` |
| 3 | Video: registro de clientes con QR (~2-3 min) | Video | `/recursos` |
| 4 | Plantilla: mensajes para campañas | Texto | `/recursos/plantillas` |
| 5 | Guía: interpretar reportes | Texto → MD/PDF | `/recursos/guias/reportes` |
| 6 | Guías de soporte (2 más) | Texto | `/recursos/guias/*` |
| 7 | Afiche QR imprimible para el comercio | Imagen/PDF | plantillas descargables |
| 8 | Miniatura del video | Imagen | cover del player |

---

## 3. Prompts de imágenes (miniaturas y portadas)

**Specs**: 16:9, 1200×675 px mínimo, exportar WebP (< 120 KB) o PNG.
Estilo uniforme: flat 3D, paleta PineappleLoyalty, fondo crema `#FDFAF0`.

> Tip: si el generador no respeta hex, pegar la paleta en texto:
> "color palette: deep green #0F5132, bright green #22C55E, pineapple yellow
> #FBBF24, warm cream background".

### 3.1 Miniatura — Guía "Cómo configurar tu programa de fidelización"

```
A clean flat 3D illustration for a SaaS tutorial thumbnail. A laptop showing
a loyalty program admin dashboard with a dark green sidebar and form fields.
Beside the laptop, a floating smartphone displaying a green digital loyalty
stamp card for an ice cream shop called "Fruppy Helados" with 10 stamp slots,
8 filled in yellow. Small QR code element floating between them. A stylized
pineapple leaf in the top corner as decoration. Warm cream background, soft
shadows, rounded shapes, modern SaaS marketing style, color palette: deep
green #0F5132, bright green #22C55E, pineapple yellow #FBBF24, cream #FEF3C7.
No text other than the brand name on the card. 16:9.
```

### 3.2 Miniatura — Video "Cómo se registran tus clientes con el QR"

```
Flat 3D illustration for a video thumbnail. A customer's hand holding a
smartphone scanning a QR code on a small white table tent card on a café
counter. The phone screen shows a green loyalty signup form. Behind, a soft
blurred ice cream shop counter with pastel colors. A pineapple leaf
decoration in the corner. Warm cream background, rounded friendly shapes,
color palette: deep green #0F5132, bright green #22C55E, pineapple yellow
#FBBF24. Composition leaves center-right space for a play button overlay.
16:9.
```

### 3.3 Miniatura — Plantilla "Mensajes listos para campañas"

```
Flat 3D illustration for a downloadable template thumbnail. A smartphone with
a green push notification bubble saying "¡Promoción especial!" popping out,
next to a small pineapple mascot and a sheet of paper with a checklist. Warm
cream background, confetti dots in yellow and green, rounded shapes, modern
SaaS marketing style, palette: deep green #0F5132, bright green #22C55E,
yellow #FBBF24. 16:9.
```

### 3.4 Miniatura — Guía "Cómo interpretar tus reportes"

```
Flat 3D illustration for an analytics tutorial thumbnail. A dashboard card
with a bright green bar chart trending up (6 bars), a small donut chart, and
a smartphone beside it showing a loyalty card. A magnifying glass hovering
over the bars. Pineapple leaf accent, warm cream background, palette: deep
green #0F5132, bright green #22C55E, yellow #FBBF24, cream #FEF3C7. 16:9.
```

### 3.5 Afiche QR imprimible (para el comercio — tamaño carta vertical)

```
Vertical poster design (letter size) for a loyalty program. Top: stylized
pineapple logo mark. Center: large white rounded card with a QR code
placeholder and headline "Escanea y regístrate" and subheadline "Únete a
nuestro programa de fidelización". Bottom: a digital stamp card preview with
10 slots. Warm cream background with pineapple leaves framing the corners,
flat illustration style, palette: deep green #0F5132, bright green #22C55E,
yellow #FBBF24. Clean, printable, high contrast QR area.
```

*(El QR real se superpone después con el código que genera el panel — nunca
generar el QR con IA.)*

---

## 4. Videos — prompts y guiones

**Specs**: MP4, 1080p, duración 60–180 s, subtítulos en español, música
suave. Herramientas sugeridas: captura de pantalla real (OBS/Loom) + voz IA
(ElevenLabs, voz en español latino neutro) o video generado (Veo/Runway)
para b-roll de apertura/cierre.

### 4.1 Guion — "Cómo configurar tu programa de fidelización" (~2 min)

```
ESCENA 1 (0:00-0:10) — Logo PineappleLoyalty animado sobre fondo crema.
Voz: "En menos de dos minutos vas a tener tu programa de fidelización listo."

ESCENA 2 (0:10-0:50) — Screen recording del panel admin real.
Voz: "Entra a tu panel, crea un nuevo programa y elige el tipo: puntos o
sellos. Para Fruppy Helados elegimos sellos: 10 sellos y el cliente gana
un helado gratis."

ESCENA 3 (0:50-1:20) — Recording: subir imagen, definir beneficio, guardar.
Voz: "Personaliza la tarjeta con el nombre de tu negocio y tu imagen.
Descarga el código QR y pégalo donde tus clientes lo vean."

ESCENA 4 (1:20-1:50) — Teléfono físico escaneando el QR impreso.
Voz: "Tu cliente escanea, se registra en segundos y recibe su tarjeta en
Google Wallet. Sin apps que descargar."

ESCENA 5 (1:50-2:00) — Logo + CTA.
Voz: "Así de simple. Crea tu cuenta gratis en pineappleloyalty.com."
```

### 4.2 Guion — "Cómo se registran tus clientes" (~1 min, formato vertical 9:16)

```
ESCENA 1 — Cliente en el mostrador, toma el teléfono.
ESCENA 2 — Escanea el QR del afiche/mesa.
ESCENA 3 — Llena 3 campos, acepta términos, toca "Registrarme".
ESCENA 4 — La tarjeta verde aparece en Google Wallet.
Voz-off o texto en pantalla corto por escena.
```

### 4.3 Prompt de video IA (b-roll de apertura, Veo/Runway/Pika)

```
Cinematic flat-style 3D animation: a cozy ice cream shop counter, a customer's
hand brings a smartphone toward a small QR tent card. The phone screen lights
up green. Smooth camera slide, soft morning light, warm cream and deep green
color palette, pineapple leaf garnish on the counter. 5 seconds, loopable.
```

---

## 5. Plantillas de texto (descargables)

### 5.1 Mensajes para campañas (lista a entregar como MD/PDF)

```
REACTIVACIÓN
"¡Te extrañamos! Pasa por {negocio}, tienes una sorpresa esperándote 🍍"

SELLOS CASI COMPLETOS
"¡Ya casi! Te faltan {N} sellos para tu {beneficio}. Te esperamos."

PROMO FIN DE SEMANA
"Solo este finde: acumula el doble de sellos en {negocio}."

BIENVENIDA
"¡Bienvenido a {programa}! Tu tarjeta ya está en tu Wallet."

CUMPLEAÑOS
"¡Feliz cumple! Hoy tu {beneficio} va por nuestra cuenta 🎉"
```

### 5.2 Checklist de lanzamiento (MD/PDF descargable)

```
□ Crear cuenta y organización
□ Configurar programa (tipo, cantidad, beneficio)
□ Personalizar tarjeta (nombre, imagen)
□ Descargar e imprimir el QR
□ Probar el registro con un teléfono real
□ Activar la tarjeta en Google Wallet
□ Enviar primera campaña de bienvenida
```

---

## 6. Guías escritas — esqueleto de cada una

Cada guía es un `.md` con: título, "Tiempo estimado", "Lo que necesitas",
pasos numerados con captura del panel, y "Qué sigue". Estándar:

1. **Configurar tu programa** — crear programa, elegir puntos/sellos,
   definir beneficio, personalizar tarjeta, descargar QR.
2. **Registro de clientes con QR** — dónde poner el QR, cómo se ve el
   flujo del cliente, qué datos se piden.
3. **Enviar una campaña** — segmentar (activos/inactivos), escribir el
   mensaje, programar envío.
4. **Interpretar reportes** — clientes, visitas, retención, ventas; qué
   significa cada métrica y qué decisión tomar.

---

## 7. Convenciones de archivos en el repo

```
apps/web/public/recursos/
├── thumbs/
│   ├── guia-configurar.webp        (1200×675)
│   ├── video-registro-qr.webp
│   ├── plantilla-campanas.webp
│   └── guia-reportes.webp
├── videos/
│   └── registro-qr.mp4             (+faststart, igual que intro.mp4)
├── plantillas/
│   ├── afiche-qr.pdf
│   ├── mensajes-campanas.pdf
│   └── checklist-lanzamiento.pdf
└── guias/
    ├── configurar-programa.md
    ├── registro-qr.md
    ├── campanas.md
    └── reportes.md
```

**Importante — video**: cualquier `.mp4` que se sirva debe remuxarse con
`+faststart` (moov al inicio) o el navegador espera al final del archivo:

```bash
ffmpeg -i entrada.mp4 -c copy -movflags +faststart -an salida.mp4
```

Cuando el contenido exista, se crea la página `/recursos` y las tarjetas de
la landing pasan a enlazar a los recursos reales en lugar de `/preguntas`.
