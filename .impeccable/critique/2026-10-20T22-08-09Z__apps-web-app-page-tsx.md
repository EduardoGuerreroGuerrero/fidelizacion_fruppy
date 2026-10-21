---
target: landing pública
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Proyectos\\Fidelizacion-fruppy\\apps\\web\\app\\page.tsx"
target_fingerprint: "sha256:1f9c3817cd602191a5127eeebea0d5a8e031276a9a0c1d79ef4333fa4e042247"
target_path: "C:\\Proyectos\\Fidelizacion-fruppy\\apps\\web\\app\\page.tsx"
timestamp: 2026-10-20T22-08-09Z
slug: apps-web-app-page-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score — 20/32 (n/a: 7, 10)
1 Visibilidad 2 (sin estado activo en nav; Recursos sin aria-expanded) · 2 Mundo real 3 (jerga: push, segmento, multi-sede; íconos de sector errados) · 3 Control 3 · 4 Consistencia 2 (5 estilos de ícono en recuadro, pasteles fuera de paleta, CTAs pill vs rounded-xl, "Pineapple Loyalty" vs "PineappleLoyalty") · 5 Prevención 2 (Videos/Guías/Plantillas llevan a FAQ/contacto; "2:48" falso) · 6 Reconocimiento 3 · 8 Minimalismo 2 (9 secciones, 15.7k px en móvil, repeticiones) · 9 Recuperación 3.

## Design Specificity
Hero y Cómo funciona son propios del producto; de Funciones hacia abajo es plantilla SaaS. Detector: 28 (20 icon-tile-stack en contenido real; 7 dentro de ilustraciones aria-hidden; 1 wordmark "Loyalty" 2.3:1 en footer).

## Priority Issues
- [P1] Promesas sin respaldo: Recursos (videos, plantillas, "2:48"), "Más popular" sin base de clientes, "correo o chat" sin chat, "Múltiples métodos de pago" sin verificar. Fix: recortar Recursos a lo que existe, "Recomendado", "por correo". clarify + distill.
- [P1] El hero no lidera con "simple para no técnicos"; "Iniciar sesión" compite con "Probar gratis". Fix: subcopy de simplicidad, secundario "Ver cómo funciona". clarify.
- [P2] Una sola plantilla de tarjeta con ícono en recuadro en 5 secciones, con estilos inconsistentes y pasteles fuera de marca. layout + colorize.
- [P2] Página larga y repetitiva (pills = perks; Beneficios = Funciones; Temas = FAQ). distill.
- [P2] Hojas decorativas sobre titulares y texto en móvil; Sectores sin heladería, íconos % y ✓ errados. adapt + polish.

## Persona Red Flags
Doña Marta (heladería, Android): Google Wallet antes que "lo haces tú"; puede tocar "Iniciar sesión"; sin CTA en header móvil; "Videos tutoriales" lleva a texto. Jordan: jerga sin explicar; planes sin guía. Riley: "Más popular", "2:48", cifras decorativas.

## Minor
Flecha entre pasos puede recortarse a 1024 px; "Inicio" redundante con el logo; hero perks 12 px; falta franja "Todo en tu marca" del mockup.
