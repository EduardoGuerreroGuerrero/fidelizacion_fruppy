# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primario (confirmado):** dueños no técnicos de comercios locales en Colombia —
  cafeterías, heladerías, barberías, restaurantes, gimnasios, tiendas— que
  quieren que sus clientes vuelvan sin pagar ni mantener una app propia.
  Evalúan el producto desde la landing y lo configuran ellos mismos desde el
  panel web.
- **Secundario:** el personal del comercio (registra visitas y canjes desde el
  panel) y el cliente final del comercio (se registra con un QR desde el
  navegador y usa su tarjeta en Google Wallet o en la tarjeta web).

## Product Purpose

SaaS multiempresa para crear programas de fidelización (sellos o puntos),
administrar clientes y recompensas, y entregar tarjetas digitales en Google
Wallet o en el navegador. El éxito para el comercio es una mayor frecuencia de
visita; el éxito del SaaS es que un comercio lance su programa sin ayuda.

## Positioning

**Simple para no técnicos (confirmado como diferenciador principal):** el
programa se configura en minutos desde un panel web, sin conocimientos
técnicos. "Sin app para el cliente", "soporte en español" y "multi-sede" son
capacidades reales, pero no son el argumento que lidera.

## Operating Context

- El cliente final se registra escaneando un QR del comercio y completando un
  formulario corto; la tarjeta vive en Google Wallet o en la web.
- El personal registra visitas/compras y canjes desde el panel.
- Supabase/PostgreSQL es la fuente de verdad; Wallet solo refleja ese estado.

## Capabilities and Constraints

- Programas de sellos y de puntos; QR por cliente con identificador opaco;
  ledger inmutable de movimientos; canje atómico; multi-sede; notificaciones
  push y campañas por segmento; reportes.
- Planes publicados en la landing: Gratis ($0), Pro ($29.000 COP/mes),
  Business ($59.000 COP/mes).
- Apple Wallet: fuera de alcance por ahora (decisión del dueño, 21/10/2026).
  Solo Google Wallet; la landing no menciona Apple.
- Fuera del MVP: campañas masivas por WhatsApp/SMS/email, integración POS, IA.

## Brand Commitments

- Marca SaaS: **PineappleLoyalty**, lema "Make every visit count.". Assets en
  `public/pineapple/` (logo horizontal y vertical, isotipo, intro.mp4,
  brand-board).
- Voz: español neutro colombiano, tuteo, frases cortas y prácticas.
- La landing replica los mockups de `Muckup/landing page/`; son la referencia
  visual aprobada.
- Los comercios clientes no aparecen en la marca del SaaS. Las ilustraciones
  usan un comercio ficticio ("Heladería La Esquina").

## Evidence on Hand

- **Primer cliente piloto** en operación. No hay testimonios, cifras de
  resultados, logos de clientes ni casos publicables.
- No fabricar testimonios, métricas de clientes, logos de terceros ni
  premios. Las cifras de las ilustraciones (1.248 clientes, +42 %) son
  decorativas y no deben presentarse como resultados reales.

## Product Principles

1. Un dueño de negocio sin conocimientos técnicos debe poder lanzar su
   programa solo, en minutos.
2. El cliente final nunca instala nada.
3. No prometer en la landing lo que el producto no hace hoy.
4. Los datos de clientes se tratan según la normativa colombiana (Ley 1581).

## Accessibility & Inclusion

Objetivo WCAG 2.2 AA en superficies públicas: contraste de texto ≥ 4.5:1,
foco visible, navegación por teclado y respeto de `prefers-reduced-motion`.
