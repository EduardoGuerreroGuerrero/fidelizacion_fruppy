# Plan de simplificación — SaaS Fidelización Fruppy

Repositorio: `EduardoGuerreroGuerrero/fidelizacion_fruppy`

## Objetivo

Reducir peso visual, navegación y trabajo innecesario de la aplicación, manteniendo:
- Programas configurables por comercio: **puntos o sellos**.
- Tarjeta web pública por token.
- Apple Wallet y Google Wallet.
- QR de cliente y flujo de empleado.
- Canjes, historial y saldo consistente.
- CRM mínimo para administrar clientes.
- Aislamiento multiempresa, RLS, autorización por rol, auditoría de seguridad y rate limiting.

## Restricciones obligatorias

1. No borrar tablas, datos, migraciones ni historial.
2. No borrar definitivamente rutas o módulos durante la primera fase: primero ocultar/desvincular de la navegación y comprobar dependencias.
3. No cambiar las reglas de cálculo ni el modelo del ledger para conseguir mejoras visuales.
4. No modificar saldos directamente desde el cliente ni desde acciones que omitan las RPC autorizadas.
5. No quitar RLS, controles de membresía/rol, idempotencia, reversos, rate limits o auditoría de eventos sensibles.
6. No desactivar ni desplegar Wallet sin autorización expresa.
7. No desplegar a producción ni modificar datos reales sin autorización expresa.
8. Trabajar en rama separada; inspeccionar `git diff` antes de aprobar cambios.

## Diagnóstico del código revisado

### Tarjeta del cliente
- `apps/web/app/t/[token]/page.tsx`: pantalla principal. Presenta tarjeta, progreso para sellos, próxima recompensa, promociones y accesos rápidos.
- `apps/web/app/t/[token]/tarjeta/page.tsx`: vuelve a presentar tarjeta, progreso y recompensa. Hay duplicación funcional con el inicio.
- `apps/web/app/t/[token]/_components/loyalty-card.tsx`: tarjeta visual con nombre, contador y acceso al QR.
- `apps/web/app/t/[token]/_components/cards.tsx`: componentes de recompensa, historial y visita; incluye tarjetas con imágenes decorativas.
- `apps/web/app/t/[token]/_components/chrome.tsx`: encabezado y títulos de sección; el encabezado muestra una campana decorativa sin flujo de notificaciones confirmado.
- `apps/web/app/t/[token]/_components/tab-bar.tsx`: navegación inferior con cinco pestañas y destinos secundarios.
- `apps/web/app/t/[token]/_components/data.ts`: obtiene la proyección pública mediante una RPC (`get_card_app_data`). Su contrato debe revisarse antes de cambiar datos cargados.
- `apps/web/app/t/[token]/promociones/page.tsx` y `_components/promos.ts`: módulo promocional con banners y categorías; candidato a ocultar de la experiencia inicial, no a borrar en esta fase.
- `apps/web/app/t/[token]/escanear/page.tsx`: muestra QR al cliente. Evaluar renombrar visualmente a “Mostrar mi QR” para no confundirlo con el escáner del empleado.
- Rutas adicionales encontradas: `bonos`, `perfil`, `sedes`, `tarjeta`, `promociones`, `escanear`. Revisar sus enlaces entrantes antes de ocultar cualquier destino.
- `apps/web/app/t/[token]/layout.tsx`: marco de tarjeta móvil y barra inferior; candidato a simplificar a una navegación pequeña.

### Panel del administrador
- `apps/web/app/dashboard/[org]/layout.tsx`: define el menú según rol.
- `apps/web/app/dashboard/[org]/nav.tsx`: navegación actual en formato de píldoras; puede reducirse visualmente.
- `apps/web/app/dashboard/[org]/page.tsx`: resumen inicial con consultas de clientes, visitas y canjes.
- Rutas principales existentes: `customers`, `scan`, `programs`, `rewards`, `analytics`, `team`, `locations`, `settings`, `audit`.
- `apps/web/lib/loyalty/actions.ts`: operaciones de fidelización, incluida emisión de tarjetas y operaciones del motor. Tratar como lógica crítica; refactorizar solo si los tests lo justifican.
- `apps/web/lib/admin/actions.ts`: cambios de programas, recompensas y configuración. Conservar validación de sesión y membresía.
- `apps/web/lib/customers/actions.ts`: altas/ediciones CRM y validación. Conservar consentimiento separado y controles de acceso.
- `docs/SECURITY.md` y `docs/ARCHITECTURE.md`: documentos de referencia para las invariantes de seguridad y saldo.

## Experiencia propuesta

### A. Tarjeta del cliente: una sola pantalla principal

La pantalla inicial `/t/[token]` debe mostrar, en este orden:

1. Marca del comercio y nombre de pila del cliente.
2. **Saldo grande** con unidad correcta: “35 puntos” o “6 sellos”.
3. Meta/progreso cuando aplique: “35 de 50 puntos” o “6 de 10 sellos”.
4. Próxima recompensa y cuánto falta, o aviso “Premio disponible”.
5. Botón visible “Mostrar mi QR”.
6. Acceso secundario opcional al detalle de recompensas.

Eliminar de la pantalla inicial:
- Banner y bloque “Promociones para ti”.
- Campana decorativa si no hay notificaciones reales.
- Repeticiones del mismo contador/progreso.
- Imágenes decorativas redundantes y sombras grandes.
- Accesos que dupliquen el mismo destino.

La tarjeta puede conservar el diseño de marca, pero debe priorizar texto legible y un contador claro. Cargar imágenes no esenciales solo si siguen aportando valor.

### B. Navegación del cliente

Primera opción recomendada: navegación mínima de dos destinos:
- **Mi tarjeta** (saldo, progreso, próxima recompensa).
- **Mi QR** (código listo para presentar en caja).

El catálogo de recompensas puede estar como bloque secundario en “Mi tarjeta” o como destino adicional si las pruebas de usabilidad muestran que se necesita. No mostrar “Escanear” como si el cliente escaneara su propia tarjeta: el cliente muestra el QR; el empleado escanea.

Mantener las rutas existentes durante la primera entrega, aunque algunas dejen de aparecer en la barra inferior. No borrar promociones, sedes, perfil o bonos hasta verificar referencias, tráfico y decisión de producto. Si se decide retirar una ruta más adelante, usar una redirección o pantalla sencilla de transición en vez de romper enlaces antiguos.

### C. Programa configurable: puntos o sellos

No duplicar la aplicación para cada tipo. Usar `program_type` como fuente de verdad:
- `stamps`: mostrar sellos actuales y meta `stamp_goal`.
- `points`: mostrar puntos actuales y, si el programa define un umbral de recompensa, el progreso hacia ese umbral.
- Etiquetas, unidad, meta y coste de recompensas deben corresponder al tipo de programa.
- No comparar coste de sellos con saldo de puntos ni mezclar recompensas de programas distintos.
- Para puntos sin una meta global, mostrar saldo actual y el umbral de la próxima recompensa.

**Revisión importante:** en `page.tsx` se determina el progreso principal con `program_type`, y las recompensas tienen `cost_stamps`/`cost_points`. Antes de simplificar la presentación, probar los casos de puntos y sellos, especialmente cuando no hay meta o no hay recompensas activas. No modificar datos existentes para corregir la UI.

### D. Panel de administración

Navegación principal propuesta:

1. **Inicio** — resumen básico: clientes activos, visitas recientes y canjes.
2. **Registrar visita** — escanear QR/buscar cliente, registrar acumulación y mostrar confirmación.
3. **Clientes** — buscar, abrir ficha, emitir/ver tarjeta e historial.
4. **Programa y premios** — agrupar visualmente la configuración del programa y las recompensas; pueden seguir siendo rutas internas separadas en esta fase.

Opciones secundarias para propietario/admin:
- **Configuración**: marca, moneda, zona horaria y reglas.
- **Equipo**: conservar para comercios que tengan más de un usuario.
- **Sedes**: mantener accesible, pero no destacar si el comercio tiene una sola sede.
- **Analítica**: mover a “Más” o sección secundaria.
- **Auditoría**: ocultar del menú de uso diario a quien no corresponda, pero mantener la ruta protegida y los registros.

No quitar controles de rol en el servidor. Ocultar una opción del menú solo es UX; cada página y acción debe continuar verificando sesión, membresía, rol y RLS.

## Archivos a modificar primero

### Entrega 1 — cambios de UI de bajo riesgo
1. `apps/web/app/t/[token]/page.tsx`
   - Quitar el bloque promocional del inicio.
   - Evitar duplicación de progreso/recompensa.
   - Dejar saldo, progreso, próxima recompensa y acceso a QR.
2. `apps/web/app/t/[token]/_components/chrome.tsx`
   - Simplificar `HomeHeader`; retirar campana si no existe un sistema de notificaciones real.
3. `apps/web/app/t/[token]/_components/loyalty-card.tsx`
   - Reducir elementos decorativos sin eliminar nombre, saldo, unidad ni acceso al QR.
4. `apps/web/app/t/[token]/_components/tab-bar.tsx`
   - Reducir destinos visibles a tarjeta y QR; revisar accesibilidad y estados activos.
5. `apps/web/app/t/[token]/layout.tsx`
   - Ajustar el espacio reservado a la barra inferior tras reducir pestañas.
6. `apps/web/app/dashboard/[org]/layout.tsx`
   - Reducir navegación visible, conservando opciones según rol.
7. `apps/web/app/dashboard/[org]/nav.tsx`
   - Compactar el menú y comprobar móvil.

### Entrega 2 — rendimiento sin cambiar el modelo
8. `apps/web/app/t/[token]/_components/data.ts`
   - Auditar los campos devueltos por `get_card_app_data`.
   - Si la RPC devuelve visitas, redenciones, sedes o recompensas que la pantalla principal ya no utiliza, evaluar una RPC/proyección más pequeña para inicio.
   - Mantener la RPC actual mientras existan pantallas secundarias que dependan de todos esos campos.
9. `apps/web/app/t/[token]/_components/cards.tsx`
   - Reducir imágenes decorativas en tarjetas de recompensa; conservar componentes usados por pantallas secundarias.
10. `apps/web/app/dashboard/[org]/page.tsx`
   - Mantener un resumen mínimo y limitar actividad reciente a pocos registros; medir consultas antes de optimizar más.
11. `apps/web/app/dashboard/[org]/analytics/page.tsx`
   - Dejar accesible, pero no en el menú principal.

### Archivos críticos que no se deben simplificar a ciegas
- `apps/web/lib/loyalty/actions.ts`
- `apps/web/lib/admin/actions.ts`
- `apps/web/lib/customers/actions.ts`
- `supabase/migrations/*`
- RPCs de acumulación, canje, emisión de tarjeta, tarjeta pública y auditoría.
- Adaptadores y sincronización Wallet, `apps/web/lib/wallet/*` (confirmar ruta exacta en el árbol antes de editar).

Solo se cambian si un test descubre un defecto concreto y con revisión específica.

## Apple Wallet y Google Wallet

Mantener ambos flujos habilitables por configuración. La tarjeta web/QR debe seguir funcionando aunque Wallet no esté configurado o falle una sincronización.

Validar:
- Emisión, actualización y revocación de pase.
- Actualización de saldo después de una acumulación/canje.
- Reintentos idempotentes.
- Fallo del proveedor Wallet sin revertir ni duplicar la operación del ledger.
- Credenciales y claves solo en variables secretas del servidor.
- No afirmar que Wallet está listo para producción hasta probar credenciales reales y un pase en los dispositivos/plataformas correspondientes.

No incluir funciones de Wallet en el cliente web si no son necesarias para consultar el saldo; conservar el backend y los enlaces/acciones para añadir el pase.

## Plan de ejecución por fases

### Fase 0 — línea base y protección
- Crear rama `feat/simplify-loyalty-ui`.
- Confirmar estado limpio de Git y registrar commit inicial.
- Leer scripts reales de test en `package.json`/workspace.
- Ejecutar lint, typecheck, tests y build antes de cambios.
- Guardar resultados como referencia; no tocar datos de producción.

### Fase 1 — tarjeta mínima
- Simplificar inicio y navegación de cliente.
- Mantener QR y Wallet.
- No borrar rutas ni migraciones.
- Probar programa de sellos, programa de puntos, tarjeta revocada, cero recompensas y tarjeta no encontrada.

### Fase 2 — panel mínimo
- Reducir menú principal a Inicio, Registrar visita, Clientes y Programa/Premios.
- Pasar Analítica a opción secundaria; sedes/equipo/configuración/auditoría quedan según rol.
- Probar permisos de `staff`, `manager`, `admin` y `owner` en UI y servidor.

### Fase 3 — optimización de consultas y recursos
- Medir tamaño de bundles, número de RPCs y tiempo de carga antes/después.
- Ajustar consultas solo después de revisar quién consume cada dato.
- No introducir caché en saldos personales si puede mostrar saldos desactualizados.
- Optimizar o retirar imágenes no esenciales y comprobar rendimiento móvil.

### Fase 4 — validación de extremo a extremo
- Crear o reutilizar datos de prueba en entorno de pruebas; no alterar datos reales.
- Registrar una visita con puntos y otra con sellos.
- Repetir petición con misma clave de idempotencia y verificar que no duplica.
- Canjear premio disponible y comprobar que no se permite saldo negativo ni doble canje concurrente.
- Comprobar que un usuario de otra organización no puede ver ni cambiar el cliente.
- Comprobar tarjeta revocada, token inválido y rate limit.
- Probar Wallet y confirmar que sus fallos no alteran el saldo.
- Comparar lint, typecheck, tests y build contra la línea base.

### Fase 5 — revisión, no despliegue automático
- Entregar resumen de archivos cambiados, diferencias visuales, pruebas y problemas pendientes.
- Inspeccionar `git diff` y confirmar que no hay cambios de migraciones/datos/secretos no autorizados.
- Esperar autorización explícita antes de fusionar o desplegar.

## Criterios de aceptación

- El cliente entiende su saldo y su progreso en pocos segundos.
- Un solo contador principal por pantalla; unidad correcta para puntos/sellos.
- QR fácil de encontrar y funcional.
- Próxima recompensa coherente con el tipo de programa.
- Panel principal con máximo cuatro tareas de uso frecuente.
- Apple/Google Wallet permanecen disponibles y desacoplados del éxito de una operación de saldo.
- Sin cambios destructivos a datos o migraciones.
- RLS, roles, rate limiting, ledger append-only, reversos e idempotencia continúan cubiertos por pruebas.
- Lint, typecheck, pruebas y build pasan, o se documenta con precisión cualquier fallo preexistente.
- Ningún despliegue a producción sin autorización.

## Instrucción breve para el agente ejecutor

Implementa este plan por fases, empezando únicamente por la Fase 0 y la Fase 1. Inspecciona el estado del repositorio, ejecuta las comprobaciones existentes y trabaja en una rama separada. No borres archivos, rutas, tablas, datos ni migraciones. No cambies el motor de puntos/sellos ni Wallet por motivos de diseño. No despliegues ni modifiques datos de producción. Al terminar cada fase, informa los archivos cambiados, pruebas ejecutadas, resultados y cualquier riesgo; espera autorización antes de pasar a acciones destructivas o despliegue.
