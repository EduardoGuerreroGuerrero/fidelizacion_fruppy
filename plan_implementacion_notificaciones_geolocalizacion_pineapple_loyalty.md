# Plan de implementación: notificaciones y geolocalización en Pineapple Loyalty

**Proyecto:** Pineapple Loyalty\
**Objetivo:** completar las funciones que faltan para que los comercios
puedan enviar campañas a clientes con tarjetas de Google Wallet y
configurar notificaciones por proximidad, con controles de privacidad y
pruebas antes de producción.

## 1. Estado actual identificado

Según la revisión del repositorio:

-   Existe lógica de envío de mensajes y campañas en
    `apps/web/lib/wallet/push.ts`, incluyendo
    `pushCampaignToWallets(orgId, title, body)`.
-   La actualización de una tarjeta puede utilizar `TEXT_AND_NOTIFY`; el
    código contempla un límite de hasta **3 notificaciones por tarjeta
    en 24 horas** y puede degradar a solo texto cuando se alcanza la
    cuota.
-   La integración de Google Wallet se gestiona desde
    `apps/web/lib/wallet/passlet.ts`.
-   La configuración de Google Wallet está desactivada por defecto en
    `.env.example` (`GOOGLE_WALLET_ENABLED=false`).
-   El flujo de guardado de la tarjeta existe en
    `apps/web/app/t/[token]/wallet/google/route.ts`.
-   La plantilla de la tarjeta revisada no incorpora todavía
    `MerchantLocations`; por tanto, la configuración de notificaciones
    por proximidad está pendiente.
-   La existencia de funciones backend no confirma que el panel de
    campañas esté completamente conectado ni que el envío real a Google
    Wallet haya sido probado de extremo a extremo.

> **Criterio:** reutilizar la lógica existente, evitar duplicar
> servicios y no dar por terminada una función hasta probarla con
> credenciales y tarjetas reales de prueba.

## 2. Alcance funcional

### A. Campañas y notificaciones de Google Wallet

El comercio podrá:

1.  Crear una campaña desde el panel de administración.
2.  Seleccionar una plantilla o redactar un mensaje.
3.  Previsualizar el mensaje y revisar el público destinatario.
4.  Enviar la campaña a las tarjetas elegibles de su organización.
5.  Consultar el resultado: procesadas, enviadas, omitidas por cuota,
    fallidas y pendientes.
6.  Ver el historial de campañas y evitar envíos duplicados.

Plantillas iniciales recomendadas:

-   Bienvenida.
-   Reactivación de clientes.
-   Puntos o sellos acumulados.
-   Promociones y novedades.
-   Cumpleaños.
-   Recompensas disponibles.
-   Vencimiento de una promoción o beneficio.

Variables sugeridas: `{negocio}`, `{nombre}`, `{beneficio}` y
`{fecha_fin}`. Si una variable no tiene valor, debe sustituirse por
texto alternativo seguro o eliminarse; nunca debe enviarse como marcador
sin resolver.

### B. Notificaciones por proximidad

El comercio podrá:

1.  Registrar una o varias ubicaciones físicas.
2.  Introducir dirección y coordenadas geográficas, con validación de
    latitud y longitud.
3.  Asociar las ubicaciones a la tarjeta o clase de Google Wallet
    conforme a las capacidades de la API.
4.  Configurar el texto que se mostrará cuando Google Wallet determine
    que la tarjeta es relevante cerca de una ubicación.
5.  Previsualizar y probar la configuración antes de publicarla.
6.  Editar o desactivar ubicaciones y sus mensajes.

**Importante:** esto no equivale a rastrear continuamente al cliente.
Google Wallet decide cuándo mostrar una notificación de proximidad según
sus propios criterios y permisos del usuario. Pineapple Loyalty no debe
afirmar que conoce la ubicación actual del titular por el mero hecho de
configurar geocercas.

## 3. Plan de trabajo por fases

### Fase 0 --- Verificación técnica y criterios de aceptación

-   [ ] Revisar el flujo actual de autenticación, organizaciones y
    roles.
-   [ ] Confirmar qué pantallas de campañas ya existen y conectarlas con
    los servicios existentes, sin duplicar lógica.
-   [ ] Confirmar cómo se guardan los pases, sus estados y las cuotas de
    notificación.
-   [ ] Verificar las versiones y capacidades reales de la biblioteca
    `passlet` y de la API de Google Wallet.
-   [ ] Crear un entorno de pruebas separado de producción.
-   [ ] Definir registro de errores sin guardar contenido personal
    innecesario.

**Entregable:** diagnóstico breve con archivos afectados, dependencias y
brechas confirmadas.

**Aceptación:** se conoce el flujo completo desde el panel hasta el
servicio de Google Wallet y se identifica qué falta por implementar.

### Fase 1 --- Servicio de campañas

-   [ ] Crear o completar el formulario de campaña: nombre interno,
    título, cuerpo, tipo y fecha de envío si aplica.
-   [ ] Validar longitud y contenido de los mensajes de acuerdo con las
    restricciones de Google Wallet.
-   [ ] Obtener únicamente las tarjetas elegibles de la organización
    autenticada.
-   [ ] Reutilizar `pushCampaignToWallets` o refactorizarla si se
    detectan problemas de aislamiento, rendimiento o manejo de errores.
-   [ ] Implementar procesamiento por lotes para evitar operaciones
    excesivas y facilitar reintentos.
-   [ ] Registrar un resultado por tarjeta, sin exponer datos de otros
    comercios.
-   [ ] Aplicar idempotencia para que un doble clic o reintento no envíe
    la misma campaña dos veces.
-   [ ] Respetar la cuota de hasta 3 notificaciones por tarjeta cada 24
    horas; mostrar cuántas se omitieron o se enviaron solo como
    actualización de texto.
-   [ ] Diferenciar estados: `queued`, `sent`, `skipped_quota`, `failed`
    y, si aplica, `cancelled`.
-   [ ] Implementar permisos por rol y confirmación antes del envío
    definitivo.
-   [ ] Añadir historial de campañas y un resumen de resultados.

**Aceptación:** un usuario autorizado puede crear, previsualizar y
enviar una campaña solo a clientes de su organización; puede consultar
resultados y errores sin repetir envíos accidentalmente.

### Fase 2 --- Persistencia e interfaz de ubicaciones

-   [ ] Diseñar una entidad de ubicaciones comerciales vinculada a la
    organización.
-   [ ] Guardar nombre, dirección, latitud, longitud, estado, fecha de
    creación y quién la modificó.
-   [ ] Validar coordenadas y restringir el acceso por organización.
-   [ ] Permitir crear, editar, desactivar y eliminar ubicaciones según
    las reglas de retención definidas.
-   [ ] Incorporar un panel de ubicaciones con formulario, mapa o
    mecanismo fiable de validación de coordenadas.
-   [ ] Permitir hasta el máximo que admita la API de Google Wallet en
    la clase/objeto correspondiente; validar el límite vigente antes de
    publicarlo.
-   [ ] Definir qué ocurre cuando se modifica una ubicación: actualizar
    los pases afectados, registrar el resultado y permitir reintentar
    errores.
-   [ ] No usar la ubicación para segmentación o seguimiento adicional
    sin una finalidad informada y una base legal apropiada.

**Aceptación:** cada comercio administra únicamente sus propias
ubicaciones y los cambios quedan reflejados en la configuración que se
envía a Google Wallet.

### Fase 3 --- Integración con Google Wallet

-   [ ] Confirmar el formato exacto de `MerchantLocations` que admite la
    versión instalada de la biblioteca y la API vigente.
-   [ ] Incorporar las ubicaciones en la clase u objeto de Wallet según
    corresponda, sin asumir que basta con guardarlas en la base de
    datos.
-   [ ] Asegurar que la emisión y actualización de pases mantiene la
    configuración de ubicaciones.
-   [ ] Manejar errores de permisos, credenciales, publicación y límites
    de API.
-   [ ] Añadir logs técnicos con identificadores de operación, sin
    registrar claves privadas ni datos sensibles.
-   [ ] Crear una pantalla o comando administrativo para comprobar la
    configuración de Wallet y el estado de las credenciales.
-   [ ] Documentar la configuración requerida en variables de entorno y
    mantener los secretos fuera del repositorio.

Variables existentes que deben revisarse en el entorno, no copiarse con
valores secretos al código:

-   `GOOGLE_WALLET_ENABLED`
-   `GOOGLE_WALLET_ISSUER_ID`
-   `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON`
-   `GOOGLE_WALLET_PRIVATE_KEY`
-   `GOOGLE_APPLICATION_CREDENTIALS`
-   `NEXT_PUBLIC_BASE_URL`

**Aceptación:** un pase de prueba contiene la configuración de ubicación
válida y Google Wallet acepta la publicación o actualización; los
errores se muestran y registran correctamente.

### Fase 4 --- Privacidad y cumplimiento en Colombia

Antes de activar las funciones para clientes, revisar con el responsable
de privacidad o asesoría jurídica los textos definitivos y el flujo de
consentimiento.

-   [ ] Publicar una política de tratamiento de datos accesible desde el
    registro y las comunicaciones.
-   [ ] Informar la identidad y contacto del responsable, las
    finalidades, los derechos del titular y cómo ejercerlos.
-   [ ] Solicitar autorización previa, expresa e informada cuando
    corresponda y conservar evidencia verificable de la autorización.
-   [ ] Separar, cuando corresponda, la autorización para tratamiento
    necesario para operar el programa de fidelización de la autorización
    opcional para publicidad y campañas.
-   [ ] No condicionar la tarjeta de fidelización a aceptar marketing
    opcional si no es necesario para el servicio.
-   [ ] Registrar fecha, versión del aviso, finalidades aceptadas y
    canal de captura del consentimiento.
-   [ ] Ofrecer un canal claro para consultas, reclamos, actualización o
    supresión cuando proceda, y para retirar la autorización de
    marketing.
-   [ ] Incluir en correos de verificación el enlace visible a la
    política, la identificación del negocio, el motivo del mensaje y un
    canal de soporte/reportar registro no solicitado.
-   [ ] Explicar con claridad que las notificaciones de proximidad
    dependen de los permisos y ajustes del propio usuario en Google
    Wallet y en su dispositivo.
-   [ ] Definir plazos de conservación y eliminación de registros de
    campañas y consentimientos.
-   [ ] Revisar la aplicación de la Ley 1581 de 2012 y su reglamentación
    vigente; validar la redacción jurídica final antes del lanzamiento.

**Aceptación:** no se habilitan campañas promocionales para una persona
si no se cumplen los requisitos de autorización aplicables; el negocio
puede demostrar qué autorizó cada titular y cuándo.

### Fase 5 --- Pruebas de calidad y seguridad

#### Pruebas automatizadas

-   [ ] Usuario de una organización no puede enviar campañas a otra
    organización.
-   [ ] Usuarios sin permiso no pueden crear ni enviar campañas.
-   [ ] Las variables de plantilla se resuelven correctamente.
-   [ ] Un mensaje inválido se rechaza antes de enviar.
-   [ ] La cuota de notificaciones se aplica por pase y ventana de 24
    horas.
-   [ ] Reintentar una operación no duplica envíos.
-   [ ] Los errores parciales de un lote no detienen indebidamente todos
    los demás envíos.
-   [ ] Las ubicaciones inválidas o duplicadas se gestionan
    correctamente.
-   [ ] Los cambios de ubicación actualizan la configuración correcta.
-   [ ] Los consentimientos y retiros quedan registrados y se respetan
    en la selección de destinatarios.

#### Pruebas manuales de extremo a extremo

-   [ ] Configurar credenciales reales de prueba de Google Wallet.
-   [ ] Crear una tarjeta de prueba y guardarla en un dispositivo
    compatible.
-   [ ] Enviar una campaña controlada y verificar la actualización en el
    pase.
-   [ ] Probar la cuota de notificaciones sin hacer envíos promocionales
    masivos.
-   [ ] Configurar una ubicación de prueba y validar el comportamiento
    en un dispositivo con permisos adecuados.
-   [ ] Verificar los escenarios en los que el usuario no habilitó
    notificaciones o ubicación.
-   [ ] Comprobar los mensajes de error, el historial y los registros.
-   [ ] Confirmar que ningún secreto aparece en logs, frontend o
    respuestas API.

**Aceptación:** las pruebas automatizadas pasan y las pruebas reales de
Wallet quedan documentadas. No se considera validada la geolocalización
solo porque el backend acepte las coordenadas.

### Fase 6 --- Despliegue gradual y operación

-   [ ] Lanzar primero en una organización interna o de prueba.
-   [ ] Mantener las funciones desactivadas por defecto mediante
    configuración o feature flags.
-   [ ] Limitar el volumen inicial de campañas y revisar errores, cuotas
    y comentarios.
-   [ ] Añadir métricas: campañas procesadas, tarjetas elegibles,
    notificaciones enviadas, omitidas y fallidas.
-   [ ] Crear procedimiento de pausa inmediata ante errores o quejas.
-   [ ] Documentar soporte y preguntas frecuentes para los comercios.
-   [ ] Activar para más organizaciones solo tras aprobar los criterios
    de salida.

**Aceptación:** existe un procedimiento de soporte, monitorización y
desactivación rápida.

## 4. Modelo de datos sugerido

Adaptar nombres y tipos al esquema actual antes de crear migraciones.

### `merchant_locations`

-   `id`
-   `organization_id`
-   `name`
-   `address`
-   `latitude`
-   `longitude`
-   `is_active`
-   `created_at`
-   `updated_at`
-   `created_by`

### `wallet_campaigns`

-   `id`
-   `organization_id`
-   `created_by`
-   `name`
-   `title`
-   `body`
-   `status`
-   `scheduled_at` (opcional)
-   `created_at`
-   `started_at`
-   `completed_at`

### `wallet_campaign_deliveries`

-   `id`
-   `campaign_id`
-   `wallet_pass_id`
-   `status`
-   `attempt_count`
-   `provider_message` o código de error depurado
-   `sent_at`
-   `created_at`

### Registro de autorización

Reutilizar la estructura de consentimiento existente si la hay. Debe
permitir auditar titular, finalidad, versión del aviso, fecha, canal y
retiro. Evitar duplicar datos personales que ya estén almacenados de
forma segura.

**Seguridad de base de datos:** activar y verificar políticas RLS,
comprobar `organization_id` en cada operación y no confiar en
identificadores enviados por el navegador. Las migraciones deben incluir
pruebas de acceso entre organizaciones.

## 5. Diseño de experiencia de usuario

### Panel de campañas

1.  **Campañas:** listado con estado y fecha.
2.  **Crear campaña:** nombre interno, título, mensaje y plantilla.
3.  **Destinatarios:** número estimado de tarjetas elegibles y
    exclusiones.
4.  **Vista previa:** mensaje final con variables resueltas.
5.  **Confirmación:** resumen y aviso sobre cuotas.
6.  **Resultados:** enviadas, omitidas, fallidas y opción de reintentar
    solo los fallos seguros.

### Panel de ubicaciones

1.  Listado de sucursales.
2.  Crear o editar ubicación.
3.  Validar dirección y coordenadas.
4.  Configurar el mensaje de proximidad.
5.  Revisar requisitos y permisos de Google Wallet.
6.  Publicar y consultar el estado de sincronización.

Los nombres de botones, errores y estados deben estar en español y
explicar acciones concretas. Evitar afirmar "GPS activado" si la
aplicación no puede verificar el permiso del usuario.

## 6. Orden recomendado de ejecución

  -----------------------------------------------------------------------
  Prioridad               Trabajo                 Resultado
  ----------------------- ----------------------- -----------------------
  P0                      Verificar panel y       Alcance técnico
                          backend existentes,     confirmado
                          credenciales y entorno  
                          de pruebas              

  P1                      Completar campañas,     Notificaciones de
                          permisos, cuotas,       campaña fiables
                          idempotencia e          
                          historial               

  P2                      Implementar ubicaciones Comercios pueden
                          y persistencia segura   configurar sucursales

  P3                      Añadir                  Proximidad configurada
                          `MerchantLocations` a   en los pases
                          Google Wallet y         
                          sincronizar pases       

  P4                      Completar privacidad,   Uso transparente y
                          consentimientos y       conforme
                          preferencias            

  P5                      Pruebas de integración  Evidencia de
                          y seguridad             funcionamiento

  P6                      Lanzamiento gradual y   Activación controlada
                          monitorización          
  -----------------------------------------------------------------------

## 7. Criterios para considerar el trabajo terminado

-   [ ] El comercio puede crear y enviar campañas desde la interfaz.
-   [ ] Solo se alcanzan tarjetas elegibles de la organización
    correspondiente.
-   [ ] Se respetan cuotas, errores parciales y reintentos sin duplicar
    mensajes.
-   [ ] El comercio puede gestionar ubicaciones y configurar mensajes de
    proximidad.
-   [ ] La configuración de ubicaciones se publica correctamente en
    Google Wallet.
-   [ ] La función de proximidad se prueba en dispositivos reales con
    permisos adecuados.
-   [ ] La política de privacidad, las autorizaciones y la retirada de
    marketing están implementadas y revisadas.
-   [ ] Hay pruebas automatizadas, registro de resultados y
    documentación de despliegue.
-   [ ] Las funciones pueden desactivarse rápidamente si ocurre un
    incidente.

## 8. Riesgos y decisiones que deben confirmarse

-   **Capacidad de la biblioteca:** confirmar el soporte actual de
    `MerchantLocations` en la versión instalada de `passlet`; si no lo
    expone, definir una integración compatible con la API oficial.
-   **Comportamiento de Google:** la aparición de una notificación
    cercana no puede garantizarse en un momento exacto; depende de
    Google Wallet, la configuración del dispositivo y los permisos del
    titular.
-   **Permisos del usuario:** Pineapple Loyalty no puede activar
    remotamente la ubicación del teléfono ni forzar las notificaciones
    de Google Wallet.
-   **Consentimiento:** la base jurídica y el texto final deben ser
    revisados para los usos concretos del producto y de cada comercio.
-   **Pruebas reales:** los tests que simulan respuestas no reemplazan
    una prueba de extremo a extremo con credenciales y pases de prueba.

## 9. Referencias técnicas oficiales

-   Google Wallet --- notificaciones push y notificaciones por
    proximidad:
    https://developers.google.com/wallet/generic/use-cases/trigger-push-notifications
-   Google Wallet --- tarjetas de fidelización:
    https://developers.google.com/wallet/retail/loyalty-cards
-   Colombia --- Ley 1581 de 2012 (protección de datos personales):
    consultar texto oficial y reglamentación vigente antes del
    lanzamiento.

------------------------------------------------------------------------

**Nota de implementación:** este documento es un plan de trabajo basado
en la revisión disponible del repositorio y los requisitos tratados.
Antes de programar migraciones, confirmar el esquema actual de Supabase,
las pantallas ya existentes y la versión efectiva de las dependencias
para evitar duplicar funcionalidades.
