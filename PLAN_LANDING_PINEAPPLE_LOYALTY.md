# Plan de implementación — Landing page de Pineapple Loyalty

**Objetivo:** construir una landing comercial responsive, fiel al diseño aprobado y a las funciones reales de Pineapple Loyalty.  
**Repositorio:** `fidelizacion_fruppy`  
**Stack esperado:** Next.js + TypeScript + Tailwind CSS; adaptar el plan a la estructura y dependencias existentes.

## 1. Objetivo y alcance

La página debe explicar el producto, presentar sus funciones verificadas y conducir a los visitantes a registro, inicio de sesión o contacto.

Incluye:
- Encabezado y navegación.
- Hero con propuesta de valor y llamadas a la acción.
- Cómo funciona en tres pasos.
- Beneficios.
- Funciones verificadas.
- Tipos de comercio.
- Precios o alternativa temporal aprobada.
- Preguntas frecuentes.
- CTA final y footer.
- SEO, accesibilidad, rendimiento y diseño responsive.

No incluye rediseñar el panel privado ni desarrollar nuevas funciones del producto para justificar contenido publicitario.

## 2. Reglas de marca y exactitud

### Identidad visual
Usar el logo oficial proporcionado por el propietario, sin redibujarlo, recolorearlo, deformarlo ni sustituirlo por uno generado por IA.

Paleta de referencia:
- Verde oscuro: `#0F5132`
- Verde secundario: `#22C55E`
- Amarillo piña: `#FBBF24`
- Crema: `#FEF3C7`
- Fondo claro: `#F8FAFC`

Confirmar los códigos con los archivos originales de marca. Mantener una estética limpia, moderna, con fondos claros, acentos verdes y amarillos, esquinas redondeadas y sombras sutiles.

### Capacidades del producto
- **Google Wallet** es la única integración Wallet disponible actualmente; incluirla solo si se verifica que el flujo actual funciona.
- **No incluir Apple Wallet**, su icono ni mensajes que sugieran que está disponible.
- No inventar estadísticas, porcentajes de retención, testimonios, comercios clientes ni logos de clientes.
- No publicar precios, periodos de prueba, límites ni funciones “ilimitadas” sin aprobación.
- No presentar funciones en desarrollo como disponibles.
- Describir las notificaciones solo si el canal está implementado y probado.
- No afirmar que el cliente no necesita una app sin comprobar el flujo real.
- No mostrar QR de producción que permita registrar usuarios por accidente.

## 3. Auditoría previa del repositorio

Antes de editar:
- [ ] Revisar `package.json`, versión de Next.js y estructura de rutas.
- [ ] Identificar las rutas reales de registro, inicio de sesión y panel.
- [ ] Revisar componentes, estilos y librerías existentes para reutilizarlos.
- [ ] Localizar el logo oficial y recursos de marca.
- [ ] Confirmar el estado real de Google Wallet.
- [ ] Verificar qué funciones están implementadas y utilizables.
- [ ] Confirmar dominio objetivo y enlaces legales.
- [ ] Anotar decisiones y riesgos antes de modificar archivos.

**Criterio de salida:** se conoce la estructura real y no se crean rutas duplicadas.

## 4. Arquitectura propuesta

Adaptar al proyecto existente; no duplicar estructuras si ya hay equivalentes.

```text
app/
  (marketing)/
    page.tsx
  components/
    marketing/
      MarketingHeader.tsx
      HeroSection.tsx
      HowItWorksSection.tsx
      BenefitsSection.tsx
      FeaturesSection.tsx
      IndustriesSection.tsx
      PricingSection.tsx
      FAQSection.tsx
      FinalCTASection.tsx
      MarketingFooter.tsx
      SectionHeading.tsx
      FeatureCard.tsx
      PricingCard.tsx
      FAQItem.tsx
  lib/
    marketing/
      content.ts
      site-config.ts
public/
  brand/
    [logo-oficial]
  images/
    landing/
```

Mantener la página mayoritariamente renderizada en servidor. Usar componentes cliente solo cuando sean necesarios para interacciones como el menú móvil o los acordeones. No usar una captura de la landing como fondo de toda la página: implementar cada sección como interfaz real.

## 5. Secciones de la landing

### 5.1 Encabezado
- Logo oficial.
- Navegación: Inicio, Cómo funciona, Funciones, Precios y Recursos solo si hay contenido real.
- Acciones: “Iniciar sesión” y “Probar gratis” o “Crear cuenta”.
- Menú móvil accesible.
- Verificar destinos reales; no inventar rutas.

### 5.2 Hero
**Titular sugerido:** “Convierte clientes ocasionales en clientes frecuentes”.

**Texto sugerido:** “Crea un programa de fidelización digital para tu negocio. Tus clientes pueden registrarse mediante un código QR y consultar su progreso y beneficios según las funciones disponibles en tu programa.”

Ajustar el texto a lo que realmente hace el producto.

- Mostrar captura auténtica o mockup fiel del producto.
- Mostrar QR solo como demostración y sin datos personales.
- Mencionar Google Wallet únicamente tras validar la integración.
- CTA principal: “Probar gratis” o “Crear cuenta”, según el flujo real.
- CTA secundario: “Ver cómo funciona”.
- No mostrar Apple Wallet, datos de clientes reales ni métricas ficticias.

### 5.3 Cómo funciona
Tres pasos:
1. **Configura tu programa:** el comercio define el programa con las opciones disponibles.
2. **Tus clientes se registran:** explicar el QR y los datos solicitados por el flujo real.
3. **Fomenta nuevas visitas:** describir acumulación y canje solo si están implementados.

### 5.4 Beneficios
Priorizar beneficios de proceso, no promesas numéricas:
- Facilita la administración del programa.
- Ofrece una experiencia digital a los clientes.
- Centraliza la información disponible del programa.
- Permite personalizar la experiencia de marca según las opciones existentes.

Validar cada afirmación antes de publicarla.

### 5.5 Funciones principales
La referencia visual propone estas tarjetas:

| Función | Validación obligatoria | Regla |
|---|---|---|
| Registro por QR | Probar registro completo como cliente nuevo | Mostrar si funciona de extremo a extremo |
| Google Wallet | Probar generación y guardado de tarjeta | Mostrar solo si está operativo |
| Puntos o sellos | Verificar reglas, saldo y canje | Nombrar solo modalidades implementadas |
| Notificaciones por comercio | Confirmar canal, consentimiento y aislamiento por comercio | No prometer canales no disponibles |
| Ubicación opcional | Confirmar función concreta y permisos | Omitir si no tiene uso implementado |
| Gestión multisede | Revisar datos, permisos e interfaz | Omitir si no está disponible |
| Campañas y segmentación | Confirmar función utilizable | Omitir o marcar como próxima solo con aprobación |
| Reportes y estadísticas | Revisar métricas reales del panel | Nunca inventar cifras |

Si hay menos funciones verificadas, mostrar menos tarjetas; no rellenar la página con promesas.

### 5.6 Tipos de comercio
Posibles ejemplos visuales: cafeterías, restaurantes, heladerías, barberías, boutiques y gimnasios. Presentarlos como sectores a los que puede dirigirse el producto, no como clientes actuales. Usar recursos propios, licenciados o ilustraciones coherentes con la marca.

### 5.7 Precios
No copiar los precios ilustrativos del mockup sin aprobación. Definir antes de publicar:
- Nombre y precio mensual de cada plan, en COP.
- Impuestos y condiciones.
- Límites de programas, sedes, administradores, clientes, campañas, tarjetas y reportes.
- Soporte incluido.
- Existencia de plan gratuito o periodo de prueba.
- Política al alcanzar límites.
- CTA real para contratar o cambiar de plan.

Si aún no se decide, ocultar los precios o usar una sección temporal aprobada con CTA “Solicitar información”. No anunciar “30 días gratis” si no existe.

### 5.8 Preguntas frecuentes
Preguntas posibles, con respuestas verificadas:
- ¿Mis clientes necesitan descargar una aplicación?
- ¿Cómo se registran?
- ¿Cómo funciona el programa de sellos o puntos?
- ¿Google Wallet está disponible?
- ¿Qué incluye cada plan?
- ¿Cómo se protegen los datos personales?
- ¿Puedo cancelar mi suscripción?

Eliminar cualquier pregunta cuya respuesta aún no esté definida. No afirmar que una función existe si no está implementada.

### 5.9 CTA final
Titular sugerido: “¿Listo para fidelizar a tus clientes?”
Texto breve y botón enlazado al registro o contacto real.

### 5.10 Footer
Incluir únicamente enlaces funcionales: Inicio, Funciones, Precios, Contacto, Términos, Política de tratamiento de datos, Aviso de privacidad y redes oficiales si existen. No publicar enlaces legales vacíos.

## 6. Diseño responsive y accesibilidad

- [ ] Diseñar primero para móvil y adaptar a escritorio.
- [ ] Hero en una columna en móvil y dos columnas en pantallas amplias.
- [ ] Tarjetas en una columna móvil, dos en tableta y tres o cuatro en escritorio.
- [ ] Probar 360, 390, 768, 1024 y 1440 px.
- [ ] Evitar desbordamiento horizontal y textos pequeños.
- [ ] Usar HTML semántico: `header`, `nav`, `main`, `section`, `footer`.
- [ ] Mantener un único H1 y jerarquía lógica de títulos.
- [ ] Revisar contraste, foco visible, navegación por teclado y textos alternativos.
- [ ] Hacer accesibles el menú móvil y los acordeones.
- [ ] Respetar `prefers-reduced-motion`.
- [ ] No comunicar información solo mediante color.

## 7. SEO y compartición

- Título sugerido: `Pineapple Loyalty | Fidelización digital para comercios`.
- Descripción sugerida: `Crea un programa de fidelización digital para tu negocio con registro por QR y herramientas para gestionar la relación con tus clientes.` Ajustar a funciones verificadas.
- Configurar Open Graph, imagen social oficial y favicon.
- Configurar URL canónica cuando el dominio definitivo esté conectado.
- Revisar `robots.txt`, sitemap y títulos duplicados.
- No publicar datos estructurados de precios, reseñas o valoraciones inexistentes.

## 8. Rendimiento y seguridad

- Usar `next/image` y formatos WebP/AVIF cuando proceda.
- Optimizar dimensiones, peso y carga de imágenes.
- Evitar bibliotecas pesadas para animaciones decorativas.
- No consultar Supabase para contenido público estático sin necesidad.
- No exponer claves secretas en el navegador.
- No cargar datos reales de clientes en la landing.
- Revisar errores de consola, solicitudes fallidas y enlaces rotos.
- No instalar dependencias sin justificar su necesidad.

## 9. Analítica y conversión

Solo añadir analítica si se ha aprobado y configurado. Posibles eventos:
- `landing_cta_signup_click`
- `landing_cta_login_click`
- `landing_pricing_cta_click`
- `landing_faq_open`
- `landing_contact_click`

No instalar píxeles publicitarios ni herramientas que utilicen cookies no esenciales sin revisar consentimiento y privacidad. Recopilar solo los datos necesarios.

## 10. Fases de implementación

### Fase 0 — Auditoría
- [ ] Inspeccionar estructura, rutas, componentes y dependencias.
- [ ] Confirmar logo, paleta y dominio.
- [ ] Verificar funciones reales y estado de Google Wallet.
- [ ] Identificar rutas reales de registro y login.

**Salida:** mapa del proyecto y lista de capacidades verificadas.

### Fase 1 — Contenido
- [ ] Aprobar titular, descripción y CTA.
- [ ] Completar la matriz de funciones.
- [ ] Definir precios o alternativa temporal.
- [ ] Validar FAQ, contacto y enlaces legales.
- [ ] Retirar afirmaciones no verificadas.

**Salida:** contenido aprobado y coherente con el producto.

### Fase 2 — Sistema visual
- [ ] Crear tokens de color, tipografía, espaciado, bordes y sombras.
- [ ] Incorporar el logo oficial sin alteraciones.
- [ ] Definir estilos reutilizables de botones, enlaces y tarjetas.
- [ ] Verificar consistencia visual entre secciones.

**Salida:** sistema visual consistente con la marca.

### Fase 3 — Construcción
- [ ] Implementar encabezado y navegación.
- [ ] Implementar hero y CTA.
- [ ] Implementar “Cómo funciona”.
- [ ] Implementar beneficios y funciones verificadas.
- [ ] Implementar tipos de comercio.
- [ ] Implementar precios o alternativa aprobada.
- [ ] Implementar FAQ, CTA final y footer.

**Salida:** todas las secciones acordadas están presentes y enlazadas.

### Fase 4 — Recursos gráficos
- [ ] Preparar capturas auténticas o mockups fieles.
- [ ] Etiquetar las ilustraciones como demostración si corresponde.
- [ ] Optimizar imágenes.
- [ ] Comprobar que no aparezca Apple Wallet.
- [ ] Evitar datos personales y métricas ficticias presentadas como reales.

**Salida:** recursos visuales coherentes, ligeros y precisos.

### Fase 5 — Responsive y accesibilidad
- [ ] Probar tamaños móvil, tableta y escritorio.
- [ ] Corregir desbordamientos.
- [ ] Probar navegación con teclado.
- [ ] Revisar contraste, foco y textos alternativos.
- [ ] Probar menú móvil y FAQ.

**Salida:** página utilizable en los tamaños previstos.

### Fase 6 — SEO y calidad
- [ ] Añadir metadatos, favicon e imagen social.
- [ ] Optimizar imágenes y fuentes.
- [ ] Revisar consola y solicitudes de red.
- [ ] Ejecutar lint, TypeScript y build con los comandos del repositorio.
- [ ] Revisar Lighthouse o herramienta equivalente y corregir problemas importantes.

**Salida:** build correcto y sin errores críticos conocidos.

### Fase 7 — Revisión comercial y legal
- [ ] Aprobar precios y límites.
- [ ] Probar CTA y rutas reales.
- [ ] Revisar términos, privacidad y tratamiento de datos.
- [ ] Revisar consentimiento de analítica si aplica.
- [ ] Confirmar que no se prometan funciones futuras.
- [ ] Obtener aprobación del propietario.

**Salida:** autorización para publicar.

### Fase 8 — Despliegue
- [ ] Verificar variables de entorno.
- [ ] Confirmar dominio, HTTPS y redirecciones.
- [ ] Desplegar primero a preview.
- [ ] Ejecutar pruebas de humo.
- [ ] Publicar en producción solo con autorización.
- [ ] Verificar página, enlaces, SEO y CTA en el dominio final.
- [ ] Documentar cómo revertir el despliegue.

**Salida:** página pública comprobada en el dominio objetivo.

## 11. Pruebas mínimas

### Funcionales
- [ ] El logo lleva al inicio.
- [ ] La navegación dirige a las secciones correctas.
- [ ] Registro y login apuntan a rutas reales.
- [ ] Contacto y enlaces legales funcionan.
- [ ] FAQ funciona con ratón y teclado.
- [ ] Menú móvil abre, cierra y navega.
- [ ] No hay botones sin acción.

### Contenido
- [ ] No aparece Apple Wallet.
- [ ] Google Wallet solo se anuncia con disponibilidad verificada.
- [ ] No hay precios de ejemplo sin aprobación.
- [ ] No hay métricas, testimonios o clientes inventados.
- [ ] No se anuncian funciones no implementadas como disponibles.
- [ ] Nombre y logo coinciden con la identidad oficial.

### Técnica
- [ ] Ejecutar el comando de lint del proyecto.
- [ ] Ejecutar comprobación TypeScript si aplica.
- [ ] Ejecutar build de producción.
- [ ] Revisar errores relevantes de consola.
- [ ] Revisar enlaces e imágenes rotas.
- [ ] Comprobar ausencia de scroll horizontal en móvil.
- [ ] Revisar accesibilidad básica.

## 12. Instrucciones para Codex o agente de programación

1. Inspecciona el repositorio antes de editar y resume su estructura real.
2. Identifica rutas de registro/login y componentes reutilizables.
3. Implementa el plan por fases y cambios pequeños; no reemplaces archivos sin entender su función.
4. Respeta el logo oficial y la paleta. No generes un logo sustituto.
5. No incluyas Apple Wallet. Google Wallet es la única integración Wallet actualmente disponible.
6. Valida cada función antes de anunciarla. Omite lo que no esté implementado.
7. No inventes precios, métricas, testimonios, clientes ni periodos de prueba.
8. Reutiliza dependencias existentes; evita paquetes innecesarios.
9. Ejecuta pruebas y corrige errores introducidos por los cambios.
10. Marca tareas como completadas únicamente con evidencia verificable.
11. Al terminar, informa archivos modificados, decisiones, comandos y resultados de pruebas, pendientes y riesgos.
12. No hagas cambios destructivos ni publiques a producción sin autorización explícita.

### Prompt para iniciar

> Implementa el plan `PLAN_LANDING_PINEAPPLE_LOYALTY.md` en este repositorio. Primero audita la estructura, rutas y componentes existentes; luego desarrolla la landing por fases. Respeta el logo oficial y la paleta de marca. Google Wallet es la única integración Wallet actualmente disponible; no incluyas Apple Wallet. No inventes precios, métricas ni funciones. Ejecuta lint, TypeScript y build, verifica enlaces y diseño responsive, y reporta lo completado con evidencia. No publiques a producción sin autorización.

## 13. Criterios de finalización

- [ ] La página representa fielmente la marca y las capacidades reales.
- [ ] Las secciones aprobadas están implementadas y son responsive.
- [ ] Todos los CTA y enlaces funcionan.
- [ ] Google Wallet se describe correctamente y Apple Wallet no aparece.
- [ ] Precios, funciones y condiciones están aprobados.
- [ ] No hay errores críticos de build, navegación o consola.
- [ ] Se revisaron accesibilidad, SEO y rendimiento.
- [ ] El propietario aprobó el contenido y el despliegue.
