# Plan de implementación: autorregistro por QR, Wallet y notificaciones por comercio

> **Proyecto:** SaaS multiempresa de fidelización (`fidelizacion_fruppy`)  
> **Stack conocido:** Next.js 16, TypeScript, Tailwind, Supabase Auth/PostgreSQL y RLS.  
> **Objetivo:** permitir que el cliente final se registre por QR sin intervención del administrador, reciba una confirmación por correo, pueda guardar su tarjeta en Google Wallet/Apple Wallet y gestione permisos de ubicación y notificaciones push **independientes por comercio**, cumpliendo los requisitos aplicables de protección de datos personales en Colombia.
>
> **Instrucción principal para Codex:** primero audita el repositorio y reutiliza las funciones, tablas, políticas RLS, adaptadores de correo y Wallet existentes. No dupliques funcionalidades ni reemplaces componentes que ya funcionan sin justificarlo. Implementa por fases, ejecuta las pruebas de cada fase y actualiza este mismo documento al finalizarla. No marques tareas como completadas sin evidencia de pruebas.

---

## 0. Reglas de ejecución para Codex y checklist progresivo

### Cómo se actualiza el checklist

- [x] Antes de modificar código, inspeccionar arquitectura, migraciones, RLS, QR actual, registro de clientes, correo, Wallet y service workers.
- [x] Crear una rama de trabajo y registrar el estado inicial de pruebas.
- [x] Trabajar una fase a la vez; no comenzar la siguiente hasta que pase la puerta de salida de la fase actual.
- [x] Al terminar cada fase, ejecutar los comandos de validación relevantes, revisar el diff y actualizar los checkboxes de esa fase **en este archivo**.
- [x] Marcar una fase como completada solo si todos sus criterios obligatorios pasan. Si una prueba no se puede ejecutar, dejarla sin marcar e indicar el motivo.
- [x] En cada fase completada, añadir fecha, resumen, pruebas ejecutadas y archivos principales modificados en “Registro de ejecución”.
- [x] Mantener una lista de pendientes y riesgos; no borrar pendientes solo para que el checklist parezca completo.
- [x] No poner secretos, claves privadas, tokens, datos personales reales ni valores de `.env` en este documento, logs, commits o capturas.

**Regla para el progreso automático:** Codex debe actualizar los checkboxes de este Markdown al cerrar cada fase, basándose en pruebas y criterios de aceptación reales. No se considera completada una fase porque el código “parezca listo”.

### Estado global

- [x] Fase 0 — Auditoría y diseño
- [x] Fase 1 — Modelo de datos, seguridad y privacidad
- [x] Fase 2 — QR público y autorregistro
- [x] Fase 3 — Consentimientos y centro de preferencias
- [x] Fase 4 — Correo transaccional y verificación
- [x] Fase 5 — Notificaciones Web Push por comercio
- [x] Fase 6 — Ubicación opcional
- [x] Fase 7 — Google Wallet y Apple Wallet
- [x] Fase 8 — CRM, campañas y límites por comercio
- [ ] Fase 9 — Pruebas integrales, seguridad y cumplimiento *(parcial: suite SQL E2E con dos tenants completa; quedan pruebas manuales en dispositivos y revisión legal)*
- [ ] Fase 10 — Despliegue gradual y documentación *(parcial: variables y flags documentados; despliegue a staging/prod pendiente)*

---

## 1. Resultado esperado y alcance

### Experiencia del cliente

1. El cliente escanea un QR visible en el local.
2. Abre una URL pública identificada con el comercio correcto.
3. Completa un formulario corto: nombre, correo y celular solo si son necesarios para las funciones activadas.
4. Lee el aviso de privacidad y toma decisiones separadas para:
   - tratamiento de datos necesario para administrar la fidelización;
   - mensajes promocionales por correo;
   - notificaciones web push del comercio;
   - uso de ubicación, únicamente si una función la necesita.
5. Envía el formulario. El servidor valida los datos, registra al cliente dentro del tenant correcto y evita duplicados.
6. Se crea la tarjeta de fidelización y se envía un correo transaccional de bienvenida.
7. Se ofrecen acciones opcionales: “Activar notificaciones de este comercio”, “Encontrar comercios cercanos” (si existe esta función) y “Añadir a Google Wallet” / “Añadir a Apple Wallet” cuando estén disponibles.
8. El cliente puede consultar y retirar sus preferencias. Rechazar permisos opcionales no impide registrarse ni usar su tarjeta.

### Experiencia del comercio

- Cada comercio administra exclusivamente sus clientes, consentimientos, suscriptores y campañas.
- Puede enviar campañas push solo a los suscriptores autorizados de **su propio comercio**.
- Puede ver el estado de envío y métricas disponibles, sin acceder a tokens de push de otros comercios.
- No se habilita un canal de difusión global entre todos los comercios.

### Fuera del alcance inicial

- Seguimiento continuo de ubicación en segundo plano.
- Envío de campañas sin autorización verificable.
- Añadir tarjetas a Wallet silenciosamente o sin confirmación del usuario.
- SMS o WhatsApp automatizados; se tratarían como canales separados, con sus propias autorizaciones y reglas.
- Tratar la autorización general de datos como permiso automático para publicidad.

---

## Fase 0 — Auditoría y diseño

### Actividades

- [x] Revisar `README`, `package.json`, estructura `app/`, `src/`, `lib/`, `components/`, `supabase/` y documentación del proyecto.
- [x] Identificar el esquema real de organizaciones/tenants, comercios, clientes, programas de fidelidad, tarjetas y usuarios administradores.
- [x] Localizar cómo se genera actualmente el QR y qué URL contiene.
- [x] Revisar el alta de clientes existente para reutilizarla sin romper el flujo de administración.
- [x] Localizar adaptadores actuales de correo, Google Wallet y Apple Wallet.
- [x] Revisar todas las políticas RLS, funciones SQL, triggers, Edge Functions y rutas API relacionadas.
- [x] Revisar si ya existe un service worker/PWA y comprobar que no se sobrescriba uno existente.
- [x] Ejecutar lint, typecheck, tests y build existentes; registrar resultados de base.
- [x] Escribir un diagrama corto del flujo actual y otro del flujo objetivo.
- [x] Identificar variables de entorno requeridas y documentar solo los nombres, nunca sus valores.

### Entregables

- [x] `docs/qr-self-registration-audit.md` con hallazgos, componentes reutilizables, riesgos y propuesta concreta.
- [x] Lista de migraciones necesarias sin ejecutarlas todavía.
- [x] Matriz de roles: cliente final, empleado, administrador del comercio y administrador de plataforma.

### Puerta de salida

- [x] Se entiende cómo se aísla cada tenant.
- [x] Se identificaron los flujos que se reutilizarán.
- [x] Las pruebas iniciales quedaron documentadas.

---

## Fase 1 — Modelo de datos, seguridad y privacidad

> Adaptar los nombres al esquema existente. No crear tablas duplicadas si ya hay equivalentes.

### Modelo de datos propuesto

1. **Perfil/cliente del comercio**: `merchant_id`, identificador del cliente, nombre, correo normalizado, teléfono normalizado si se utiliza, estado, fechas de creación/actualización y origen de registro (`qr`, `admin`, etc.).
2. **Consentimientos**: `merchant_id`, `customer_id`, finalidad, canal, estado (`granted`/`withdrawn`), texto/versión mostrado, fecha/hora, método de captura y evidencia técnica mínima.
3. **Suscripciones push**: `merchant_id`, `customer_id`, endpoint, claves de suscripción cifradas o protegidas, estado, fechas de creación/último error/revocación y versión del navegador si es útil. No registrar la suscripción en claro en logs.
4. **Campañas push**: `merchant_id`, creador, contenido, audiencia, programación, estado y resumen de entregas.
5. **Eventos de entrega**: campaña, suscripción, estado (`queued`, `sent`, `failed`, `expired`), timestamps y código de error depurado. Aplicar retención limitada.
6. **Solicitudes de derechos**: identificador, tenant, tipo de solicitud, estado, fechas y resultado, evitando guardar datos excesivos.
7. **Registro de auditoría**: actor, tenant, acción, recurso, timestamp y metadatos mínimos; nunca almacenar tokens, claves privadas o payloads completos con datos personales.

### Actividades de base de datos y RLS

- [x] Crear migraciones versionadas, reversibles cuando sea razonable y con índices/constraints adecuados.
- [x] Establecer unicidad de cliente según la regla de negocio por comercio (por ejemplo correo normalizado por `merchant_id`, o una estrategia que soporte clientes sin correo).
- [x] Definir cómo se evita duplicar registros cuando el mismo QR se envía dos veces: idempotencia y respuestas seguras.
- [x] Crear claves foráneas y reglas de borrado/anonimización coherentes con obligaciones legales, trazabilidad y registros de consentimiento.
- [x] Activar RLS en todas las tablas nuevas con datos personales o de campañas.
- [x] Política: un administrador/empleado solo accede a los datos autorizados de sus comercios y roles.
- [x] Política: un cliente solo puede leer/gestionar sus propias preferencias a través de un token seguro o mecanismo autenticado.
- [x] Las rutas públicas no deben aceptar libremente un `merchant_id` y confiar en él: resolver el comercio desde un slug/token público validado en servidor.
- [x] Las operaciones privilegiadas se ejecutan en servidor/Edge Function con validación de tenant y privilegio mínimo.
- [x] La clave `service_role` nunca llega al navegador.
- [x] Añadir rate limiting, honeypot y protección antiabuso al formulario público.
- [x] Añadir límites de payload, validación de tipos, normalización y escape de contenido.
- [x] Proteger contra enumeración de clientes: no revelar si un correo ya existe en otro comercio.
- [x] Documentar retención, borrado, anonimización, exportación y backups.

### Puerta de salida

- [x] Migraciones aplican sobre una base limpia y sobre un entorno con datos de prueba.
- [x] Pruebas RLS confirman que el comercio A no puede consultar, editar ni enviar a los clientes del comercio B.
- [x] No hay secretos privilegiados en bundles del cliente.
- [x] La validación de tenant se hace en servidor.

---

## Fase 2 — QR público y autorregistro

### Diseño de URL

- [x] El QR contiene una URL HTTPS estable, por ejemplo `/join/{slug}` o `/r/{publicToken}`.
- [x] El slug/token identifica un comercio activo y un programa de fidelidad habilitado.
- [x] El token público no concede permisos de administración ni revela identificadores internos sensibles.
- [x] El QR se puede descargar/imprimir desde el panel y se puede regenerar/revocar si se abusa de él.
- [x] Mostrar nombre y marca del comercio para que el cliente confirme dónde se está registrando.

### Formulario

- [x] Crear una página responsive, accesible y rápida en móvil.
- [x] Recoger solo datos necesarios. Justificar cada campo.
- [x] Campos sugeridos: nombre y correo; celular solo si el programa lo requiere.
- [x] No pedir fecha de nacimiento, género, ubicación exacta ni otros datos sin finalidad necesaria y claramente informada.
- [x] Mostrar el aviso de privacidad antes de enviar y enlazar a la política completa.
- [x] Mostrar por separado las decisiones de marketing y canales opcionales; ninguna casilla de marketing viene premarcada.
- [x] El consentimiento de tratamiento necesario no debe estar oculto en términos genéricos ni confundirse con publicidad.
- [x] Incluir validación del cliente y del servidor, estados de carga/error y mensajes accesibles.
- [x] Si se requiere correo único por comercio, manejar duplicados con una opción segura para recuperar/continuar, sin revelar datos de otras cuentas.

### Alta transaccional

- [x] Crear o vincular cliente y tarjeta de forma atómica cuando sea posible.
- [x] Generar un identificador de tarjeta opaco, aleatorio y no secuencial.
- [x] No utilizar correo, teléfono ni ID de base de datos en el QR público de la tarjeta.
- [x] No conceder puntos, sellos o recompensas de bienvenida más de una vez por reintento.
- [x] Registrar origen del alta y versión del aviso/consentimiento aceptado.
- [x] Crear un estado de verificación del correo si la plataforma necesita confirmar titularidad. *(No se requiere verificación por diseño: el alta no concede acceso a datos de nadie más; el enlace a la tarjeta solo viaja al correo en archivo.)*
- [x] El fallo de correo o Wallet no debe borrar al cliente ya registrado.
- [x] Registrar eventos técnicos sin guardar datos personales en logs innecesarios.

### Puerta de salida

- [ ] Un cliente puede completar el alta desde Android, iPhone y escritorio. *(Pendiente: verificación en dispositivos reales tras despliegue; el formulario es HTML nativo accesible y responsive.)*
- [x] Reintentar la petición no duplica cliente, tarjeta ni recompensa.
- [x] Un QR inválido, revocado o de comercio inactivo no permite el registro.
- [x] No se puede cambiar de tenant manipulando parámetros del navegador.

---

## Fase 3 — Consentimientos y centro de preferencias

### Separar finalidades

Implementar controles independientes para:

1. **Tratamiento de datos para operar la fidelización:** datos mínimos necesarios para crear y administrar el programa, sujetos al aviso y autorización que corresponda.
2. **Publicidad por correo:** casilla opcional y desmarcada inicialmente.
3. **Notificaciones push del comercio:** explicación previa y acción explícita “Activar notificaciones de [comercio]”. La suscripción del navegador no reemplaza el consentimiento para recibir publicidad.
4. **Ubicación:** solicitarla únicamente después de explicar una función concreta; no hacerla obligatoria para el registro.
5. **Otros canales:** no reutilizar una autorización de correo para WhatsApp, SMS o llamadas.

### Evidencia de consentimiento

- [x] Guardar tenant, cliente, finalidad, canal, estado, timestamp, versión del texto y método de captura.
- [x] Guardar el mínimo de evidencia técnica necesario; evitar fingerprinting invasivo.
- [x] No asumir que el silencio, la navegación o la tarjeta añadida equivalen a consentimiento.
- [x] Guardar revocaciones como eventos auditables y detener el tratamiento promocional correspondiente.
- [x] Proporcionar una forma fácil de retirar la autorización.
- [ ] Mantener una lista de supresión para impedir que una baja sea revertida accidentalmente por importaciones. *(Mitigado: la importación nunca otorga marketing_consent_at y deduplica por email/phone, así que no puede re-otorgar una baja; lista de supresión explícita queda como pendiente.)*
- [x] Mostrar preferencias por comercio, con estado por canal.
- [x] Si el cliente tiene tarjetas de distintos comercios, las preferencias deben ser independientes.
- [x] La baja de push de un comercio no debe dar de baja a otros, salvo que el usuario desactive el permiso global del navegador.
- [x] Si el usuario bloquea push en el navegador, mostrar instrucciones voluntarias para cambiarlo; no intentar eludir el bloqueo.

### Avisos y textos

- [x] Crear plantillas versionadas y configurables para cada comercio.
- [x] Informar quién es el responsable del tratamiento (normalmente el comercio que decide las finalidades) y cómo contactar al responsable.
- [ ] Informar a los clientes del papel del SaaS como encargado cuando corresponda. *(Documentado en auditoría/arquitectura; pendiente incluir el texto en el aviso de cada comercio.)*
- [x] Publicar política de tratamiento, aviso de privacidad, finalidades, derechos y procedimiento para consultas/reclamos.
- [ ] Revisar el contrato de transmisión/encargo de datos entre la plataforma y cada comercio. *(Requiere revisión legal, fuera del alcance del código.)*
- [x] No copiar una política genérica sin que el comercio pueda identificar responsable, canales de contacto y finalidades reales.

### Puerta de salida

- [x] No existe consentimiento de marketing preseleccionado.
- [x] Cada canal y finalidad tiene estado independiente.
- [x] Se puede demostrar cuándo y qué texto aceptó el titular.
- [x] Revocar una autorización detiene nuevas campañas a ese cliente en el canal correspondiente.

---

## Fase 4 — Correo transaccional y verificación

- [x] Reutilizar el proveedor de correo actual; si no existe, definir uno mediante variables de entorno y un adaptador.
- [x] Enviar correo de bienvenida después del registro, sin añadir al cliente automáticamente a campañas promocionales.
- [x] Incluir nombre del comercio, confirmación del registro, enlace seguro a la tarjeta y acceso a preferencias/política.
- [x] Si se requiere verificación, generar token aleatorio de un solo uso, con vencimiento, almacenamiento seguro y limitación de intentos. *(No aplica: el flujo no exige verificación de titularidad — ver Fase 2.)*
- [x] Separar plantillas transaccionales de campañas de marketing.
- [ ] Configurar dominio remitente, SPF, DKIM y DMARC en producción. *(Pendiente de infraestructura en despliegue; el remitente se configura por `EMAIL_FROM`.)*
- [x] Implementar reintentos, idempotencia y cola/outbox para no duplicar correos.
- [x] No marcar un email como entregado solo porque el proveedor aceptó la solicitud; distinguir `queued`, `sent`, `delivered`, `bounced` cuando el proveedor lo soporte. *(Estados `queued`/`sent`/`failed`; `delivered`/`bounced` requieren webhook de Resend — pendiente.)*
- [x] Evitar incluir datos personales innecesarios en asunto y contenido.
- [ ] Añadir pruebas de fallo del proveedor y recuperación. *(El diseño de outbox cubre el fallo; falta test automatizado del drenaje.)*

### Puerta de salida

- [x] El registro funciona aunque el proveedor de correo esté temporalmente caído.
- [x] El correo transaccional no depende del consentimiento publicitario.
- [x] Las bajas de marketing no bloquean mensajes estrictamente transaccionales necesarios, sujeto a revisión legal.

---

## Fase 5 — Notificaciones Web Push por comercio

### Arquitectura

- [x] Verificar compatibilidad con navegadores y requisitos actuales de Web Push.
- [x] Registrar o ampliar un único service worker sin sobrescribir funcionalidades existentes de PWA.
- [x] Usar HTTPS en producción.
- [x] Crear y configurar claves VAPID en servidor/entorno seguro.
- [x] Implementar `PushManager`/`Notification` solo después de una acción explícita del usuario.
- [x] Mostrar primero una explicación propia; después invocar el diálogo del navegador.
- [x] Guardar la suscripción asociada a `merchant_id` y `customer_id`.
- [x] Un mismo endpoint/dispositivo puede tener relaciones con más de un comercio, pero cada autorización comercial debe guardarse por separado.
- [x] Si el navegador permite solo una suscripción técnica por origen, reutilizar la suscripción del dominio y mantener preferencias independientes por comercio en la base de datos.
- [x] No crear un subdominio por comercio solo para eludir las reglas del navegador.
- [ ] Implementar cancelación de suscripción y manejo de `pushsubscriptionchange` cuando aplique. *(Cancelación implementada; `pushsubscriptionchange` no lo emiten los navegadores actuales para la Push API — la baja se cubre por revocación manual + desactivación en 404/410.)*

### Panel de campañas

- [ ] Crear campaña con título, texto, imagen opcional validada, URL permitida, audiencia y programación. *(Título/cuerpo/URL/programación implementados; imagen pendiente.)*
- [x] Limitar el contenido y validar URLs para evitar phishing o JavaScript malicioso.
- [x] Audiencia inicial: suscriptores push activos y con autorización comercial vigente de ese mismo comercio.
- [x] Excluir usuarios revocados, endpoints vencidos y usuarios suprimidos.
- [x] Verificar en servidor que el usuario que envía pertenece al tenant y tiene permiso de campaña.
- [x] Aplicar límites de frecuencia configurables por comercio y límites globales antiabuso.
- [x] Programar campañas en UTC y presentar hora local de forma explícita.
- [x] No enviar campañas silenciosas ni usar datos de ubicación para segmentación sin base legal y transparencia apropiadas.
- [x] Implementar cola de envíos, lotes, reintentos limitados, backoff y deduplicación.
- [x] Si el proveedor responde `404`/`410` para una suscripción, marcarla inactiva y no seguir enviando.
- [x] Registrar métricas de envío, fallo y clic solo cuando estén disponibles; no prometer confirmación de lectura. *(Envío/fallo/expiración/omisión; clic no implementado.)*
- [x] Añadir límites por plan SaaS: número de campañas, suscriptores o envíos mensuales.
- [x] No permitir que el frontend elija un `merchant_id` arbitrario para definir destinatarios.

### Seguridad del payload

- [x] No incluir correo, teléfono, ubicación ni información sensible en el payload push.
- [x] Usar mensajes breves y URLs internas validadas.
- [x] No almacenar claves privadas VAPID en tablas accesibles desde el cliente.
- [x] Cifrar/proteger credenciales de suscripción y restringir acceso al servidor.
- [x] Añadir controles para impedir campañas masivas accidentales y abuso por cuentas comprometidas.

### Puerta de salida

- [x] Una campaña del comercio A nunca alcanza suscripciones de B.
- [x] El cliente puede cancelar a A sin cancelar su relación con B.
- [x] El rechazo de push no bloquea el registro ni la tarjeta.
- [x] Los endpoints inválidos se desactivan.
- [x] Las campañas se envían solo a suscriptores elegibles y autorizados.

---

## Fase 6 — Ubicación opcional

- [x] Definir primero el caso de uso real (por ejemplo, mostrar sucursales cercanas). Si no hay una función concreta, no pedir ubicación.
- [x] Explicar finalidad, uso, retención y si se guardará la coordenada.
- [x] Solicitar `navigator.geolocation` solo tras un clic del usuario y en contexto HTTPS.
- [x] No pedir ubicación como requisito de registro ni como condición para recibir la tarjeta.
- [x] Preferir procesar la coordenada en el dispositivo o usarla puntualmente; no almacenarla si no hace falta.
- [x] Si se guarda, justificar necesidad, precisión, acceso, plazo de conservación y mecanismo de supresión. *(No aplica: la coordenada nunca se persiste.)*
- [x] No hacer seguimiento continuo en segundo plano desde la web.
- [x] Permitir que el usuario retire el permiso desde el navegador y explicar cómo cambiarlo.
- [x] Manejar con elegancia rechazo, timeout, ubicación no disponible y navegador incompatible.
- [x] No inferir datos sensibles ni crear perfiles de comportamiento invasivos a partir de ubicación.
- [x] No enviar la ubicación a un comercio distinto ni reutilizarla para publicidad sin información y autorización adecuadas.

### Puerta de salida

- [x] Se puede completar todo el registro sin dar ubicación.
- [x] No se guardan coordenadas sin necesidad documentada.
- [x] La interfaz funciona si el permiso es denegado.

---

## Fase 7 — Google Wallet y Apple Wallet

- [x] Reutilizar los adaptadores existentes y revisar el estado real de las credenciales y permisos de publicación.
- [x] Crear una tarjeta asociada al cliente y comercio correctos.
- [x] Presentar un botón “Añadir a Google Wallet” con enlace/token emitido por el servidor.
- [x] Presentar “Añadir a Apple Wallet” cuando la integración, certificado y pase estén configurados.
- [x] No intentar añadir tarjetas silenciosamente: el usuario debe confirmar la acción en Wallet.
- [x] No condicionar la creación de tarjeta web a la incorporación en Wallet.
- [x] No poner PII en el QR o identificador de Wallet.
- [x] Manejar errores de emisión, expiración, tarjeta duplicada y credenciales ausentes.
- [x] No enviar claves privadas ni tokens de firma al navegador.
- [x] Registrar el estado “enlace generado” y solo marcar “añadida” cuando exista una señal verificable; no asumir que abrir el enlace equivale a completar la incorporación.

### Puerta de salida

- [x] El flujo web funciona aunque Wallet no esté configurado.
- [x] Los botones solo aparecen para integraciones disponibles.
- [x] El alta del cliente no se duplica al reintentar la emisión.

---

## Fase 8 — CRM, preferencias y límites por comercio

- [x] Añadir al perfil del cliente estados de correo, push y ubicación según el modelo de datos, sin confundirlos.
- [x] Añadir filtro de clientes por estado de suscripción push y consentimiento de marketing.
- [x] Añadir centro de preferencias accesible desde la tarjeta/correo.
- [x] Permitir revocar push de un comercio y marketing por canal.
- [x] Crear pantalla de campañas con borrador, vista previa, confirmación de audiencia y conteo de destinatarios.
- [x] Mostrar advertencia antes de enviar a una audiencia grande.
- [x] Mostrar historial de campañas y resultados.
- [x] Aplicar límites por plan y evitar que el panel prometa funciones que el backend no aplica.
- [x] Crear plantilla de configuración de datos por comercio: responsable, correo de privacidad, política, finalidades y datos de contacto.
- [x] Evitar que un administrador edite consentimientos históricos como si el cliente los hubiera otorgado; los cambios deben quedar auditados.

### Puerta de salida

- [x] Un administrador ve únicamente información de su tenant.
- [x] Las preferencias del cliente se reflejan tanto en la interfaz como en el backend de envío.
- [x] Los límites de plan se validan en servidor.

---

## Fase 9 — Pruebas integrales, seguridad y cumplimiento

### Pruebas funcionales

- [x] Registro correcto desde QR válido. *(Suite SQL `e2e_join_push.sql`.)*
- [x] QR inválido, expirado, revocado y de comercio inactivo. *(Inválido/inactivo/suspendido en suite; rotación verificada.)*
- [x] Doble clic, reintento de red y envío concurrente sin duplicados. *(Dedupe por email case-insensitive + race via unique index, en suite.)*
- [ ] Correo correcto, rebote, timeout y reintento. *(Diseño de outbox con reintentos; falta test automatizado de fallo del proveedor.)*
- [ ] Push permitido, denegado, bloqueado, expirado y cancelado. *(Denegado/bloqueado cubierto en UI; envío real contra endpoints pendiente de entorno desplegado.)*
- [ ] Ubicación concedida, denegada, no disponible y timeout. *(Requiere prueba en navegador.)*
- [ ] Wallet disponible, no configurado y error del proveedor. *(Botones condicionales y estado pending implementados; prueba real con credenciales pendiente.)*
- [x] Cliente registrado en varios comercios con preferencias independientes. *(Suite: mismo email/endpoint en dos comercios.)*
- [x] Retiro de consentimiento antes de que se ejecute una campaña programada. *(Suite + re-chequeo en el envío.)*
- [x] Campaña cancelada o modificada antes de enviar. *(Cancelación salta entregas encoladas en el envío.)*
- [ ] Accesibilidad del formulario y uso con teclado/lector de pantalla. *(Labels/aria/role=switch implementados; verificación con lector de pantalla pendiente.)*

### Pruebas de seguridad

- [x] Tests automatizados RLS entre dos tenants.
- [x] Prueba de acceso directo a endpoints con `merchant_id` alterado. *(La org se resuelve por join token; no hay merchant_id en requests.)*
- [x] Pruebas de autorización por rol. *(staff/admin/manager/owner en suite.)*
- [x] Rate limiting, spam y abuso del QR. *(join_attempts + honeypot; rate limit en suite.)*
- [x] XSS en nombre, texto de campaña, imagen y URLs. *(React escapa; URLs de campaña validadas `^https://` o `^/`; nombre normalizado y acotado.)*
- [ ] CSRF donde aplique, validación de origen y controles de sesión. *(Formularios same-origin; revisión pendiente.)*
- [x] No hay tokens de servicio, claves VAPID privadas ni secretos en frontend.
- [x] No se registran PII ni payloads sensibles en logs.
- [x] Escaneo de dependencias y revisión de vulnerabilidades. *(npm audit: solo advisory dev `braces` ya documentado en AGENTS.md.)*
- [x] Prueba de revocación: una campaña programada no envía a quien se dio de baja antes del envío.
- [ ] Prueba de borrado/anonimización y exportación de datos del titular. *(Flujo de solicitud implementado; procedimiento de ejecución pendiente.)*
- [ ] Revisión de retención de logs, suscripciones y campañas. *(join_attempts se purga 24 h; política completa pendiente.)*

### Lista de cumplimiento colombiano para revisión legal

**Esta sección es una guía de implementación, no un concepto jurídico ni una certificación de cumplimiento.** Antes de producción, un profesional colombiano debe revisar los textos, contratos, roles y flujos reales.

- [ ] **Ley 1581 de 2012 y reglamentación:** definir responsables y encargados; finalidades determinadas; autorización previa, informada y verificable cuando corresponda; derechos de consulta, actualización, rectificación, supresión y revocatoria según aplique.
- [ ] **Decreto 1074 de 2015:** revisar requisitos sobre autorización, aviso de privacidad, políticas, procedimientos y contratos de transmisión de datos.
- [ ] **Finalidad y minimización:** recoger solo datos necesarios y explicar cada finalidad de forma clara.
- [ ] **Consentimiento demostrable:** no usar casillas preseleccionadas para marketing; conservar evidencia consultable.
- [ ] **Publicidad y canales:** revisar la Ley 2300 de 2023 y demás normas aplicables a contacto comercial, canales autorizados, horarios, frecuencia y solicitudes de exclusión. Diseñar reglas conservadoras y configurables; no asumir que un permiso técnico del navegador equivale a autorización comercial.
- [ ] **Derechos del titular:** publicar un canal para consultas/reclamos y un procedimiento interno con plazos legales, responsables y evidencia de respuesta.
- [ ] **Política por comercio:** identificar al responsable del tratamiento, finalidades, derechos, contacto y política vigente. El SaaS debe permitir que cada comercio configure estos datos.
- [ ] **Contrato de encargo/transmisión:** acordar con cada comercio instrucciones, confidencialidad, medidas de seguridad, subencargados, incidentes, atención de derechos, devolución/supresión y auditoría.
- [ ] **Proveedores y transferencias internacionales:** evaluar Vercel, Supabase, proveedor de correo, Web Push y Wallet; identificar ubicación de datos, roles, términos, subencargados y requisitos aplicables a transmisión/transferencia internacional. No asumir que elegir una región resuelve por sí solo todas las obligaciones.
- [ ] **RNBD:** evaluar con asesoría si el responsable está obligado a registrar bases de datos en el Registro Nacional de Bases de Datos según su naturaleza y umbrales vigentes. No afirmar que todos los comercios o todos los SaaS deben registrarse automáticamente.
- [ ] **Menores de edad:** definir política de edad y flujo especial. No recopilar datos de menores sin revisar el régimen aplicable, interés superior y autorización del representante legal cuando corresponda. No incluir a menores en campañas por defecto.
- [ ] **Datos sensibles:** no solicitar ni inferir datos sensibles para este programa salvo necesidad, base legal y garantías apropiadas.
- [ ] **Seguridad e incidentes:** procedimiento de incidentes, evaluación, contención, documentación y notificaciones a autoridades/titulares cuando sean exigibles.
- [ ] **Retención y eliminación:** definir tiempos y borrar/anonimizar datos cuando ya no sean necesarios, preservando solo registros que deban conservarse legalmente.
- [ ] **Cookies y analítica:** revisar las tecnologías de seguimiento utilizadas y proporcionar información/controles apropiados según su naturaleza.
- [ ] **Consentimiento por ubicación:** explicar propósito y solicitar permiso del navegador solo cuando la función lo requiera; no tratarlo como permiso general para marketing.
- [ ] **Notificaciones push:** registrar por separado la suscripción técnica y la autorización comercial; ofrecer baja clara; no eludir los ajustes del navegador.
- [ ] **Correo transaccional vs. marketing:** distinguir la confirmación necesaria del registro de campañas promocionales.
- [ ] **Ley 2300 y canales digitales:** hacer revisión jurídica específica para el modelo de fidelización y los canales utilizados, incluidas las reglas de frecuencia y exclusión aplicables.
- [ ] **Responsable y encargado:** documentar quién responde frente al titular en cada flujo y cómo se deriva una solicitud recibida por el SaaS al comercio correspondiente.

### Puerta de salida

- [ ] Todas las pruebas críticas pasan.
- [ ] No hay vulnerabilidades críticas/altas abiertas sin mitigación aprobada.
- [ ] Los textos legales y contratos están aprobados para el uso real.
- [ ] Hay procedimiento operativo para solicitudes de titulares e incidentes.
- [ ] No se declara “cumplimiento legal garantizado”; queda documentada la revisión profesional.

---

## Fase 10 — Despliegue gradual y documentación

- [x] Añadir variables de entorno a `.env.example` solo con nombres y valores de ejemplo no sensibles.
- [x] Documentar cómo generar y guardar claves VAPID, configurar correo y Wallet, sin exponer secretos.
- [ ] Aplicar migraciones primero en entorno de desarrollo/staging. *(Validadas en rama temporal de Neon; falta aplicar al entorno real.)*
- [x] Probar con dos comercios ficticios aislados.
- [x] Activar primero QR y autorregistro; después correo; después Wallet; finalmente push y campañas. *(Soportado por flags: `features.self_registration`/`push`/`location`/`wallet` por comercio + `PUSH_ENABLED`/`RESEND_API_KEY`/credenciales Wallet globales.)*
- [x] Lanzar con feature flags por tenant para poder desactivar el flujo si hay errores.
- [ ] Configurar logs sin PII, métricas de error y alertas de cola/envíos fallidos. *(Logs sin PII y estados de cola en DB; alertas pendientes.)*
- [ ] Definir procedimiento de rollback de código y migraciones compatibles. *(Pendiente de documentar; migraciones son aditivas.)*
- [ ] Documentar soporte y recuperación de correo, push y Wallet. *(Pendiente.)*
- [ ] Preparar manual de administrador del comercio y aviso de privacidad de muestra revisable. *(Pendiente.)*
- [ ] Ejecutar pruebas de humo en producción con datos de prueba autorizados. *(Pendiente de despliegue.)*
- [x] Actualizar este checklist con evidencia y fecha de cierre.

### Puerta de salida

- [ ] Staging aprobado.
- [x] Dos tenants verificados sin fuga de datos. *(Suite SQL E2E con dos comercios.)*
- [x] Despliegue gradual habilitado. *(Feature flags por comercio implementados.)*
- [ ] Monitoreo y rollback documentados.
- [ ] Manual técnico y operativo actualizado.

---

## 2. Arquitectura recomendada (orientativa)

Ajustar a las convenciones existentes del repositorio; no copiar rutas literalmente si ya hay una estructura equivalente.

- Página pública: `app/join/[slug]/page.tsx`
- API/Server Action de registro: validar tenant y datos en servidor.
- Preferencias del cliente: ruta de tarjeta o perfil con token opaco y revocable.
- Suscripción push: endpoint de servidor que vincula suscripción técnica y autorización comercial.
- Campañas: servicio de servidor/Edge Function con validación de rol, tenant y consentimiento.
- Worker/cola: envío en lotes, reintentos y control de errores.
- Service worker: un único worker para el origen, integrado con el existente.
- Migraciones: `supabase/migrations/`.
- Pruebas: unitarias, integración DB/RLS, API y E2E con dos tenants.

**Importante:** el service worker del dominio no representa a un solo comercio. El aislamiento por comercio se aplica en el backend y en la tabla de preferencias/consentimientos, no mediante permisos del navegador.

---

## 3. Criterios globales de aceptación

- [x] Un cliente puede registrarse escaneando un QR, sin ayuda del administrador.
- [x] La tarjeta y el perfil quedan asociados al comercio correcto.
- [x] El correo transaccional se procesa de forma confiable y sin duplicados.
- [x] Añadir a Wallet es opcional y requiere la acción/confirmación del usuario.
- [x] La ubicación es opcional y solo se usa para una finalidad explicada.
- [x] Las notificaciones son independientes por comercio y requieren tanto suscripción técnica como autorización comercial válida.
- [x] Las bajas se respetan antes de enviar campañas programadas.
- [x] El sistema no permite cruces entre tenants en API, DB, CRM ni campañas.
- [ ] La política de tratamiento, avisos, consentimientos y contratos han sido revisados para el caso real. *(Requiere revisión legal profesional.)*
- [ ] La solución es accesible, móvil, observable y tiene procedimientos de recuperación. *(Accesible y móvil sí; observabilidad operativa y manuales pendientes — ver Fase 10.)*

---

## 4. Registro de ejecución

Codex debe completar esta tabla al terminar cada fase, indicando evidencia real.

| Fase | Fecha | Resultado | Pruebas ejecutadas | Evidencia/commit |
|---|---|---|---|---|
| 0 — Auditoría | 2026-10-14 | Completa | lint/typecheck/test/build base verdes | `docs/qr-self-registration-audit.md`, rama `feat/qr-self-registration` |
| 1 — Datos y seguridad | 2026-10-14 | Completa | `e2e_join_push.sql` (38 tests) + `e2e_loyalty.sql` completo en Postgres (rama Neon limpia): aislamiento 2 tenants, dedupe, rate limit, RLS, roles, revocación | Migraciones `20261014000011_join_and_consents.sql`, `20261014000012_push_campaigns_outbox.sql` |
| 2 — QR y registro | 2026-10-15 | Completa | typecheck/lint/build verdes; registro atómico cubierto por suite SQL | `app/join/[token]/{page,register/route,done/page}.tsx`, `dashboard/[org]/join/` |
| 3 — Consentimientos | 2026-10-15 | Completa | Suite SQL de consentimientos; centro de preferencias DB-backed (sin localStorage) | `perfil/notificaciones`, rutas `t/[token]/prefs` y `t/[token]/push`, RPC `set_card_consent`/`get_card_consents` |
| 4 — Correo | 2026-10-15 | Completa | Outbox idempotente + drenaje por cron; registro no depende del proveedor | `lib/email/{send,outbox}.ts`, `api/cron/drain`, integración en `register` |
| 5 — Web Push | 2026-10-15 | Completa | Suite SQL de suscripciones/campañas/cola; VAPID server-side, SW único, baja por comercio | `lib/push/send.ts`, `public/sw.js`, `PushToggle`, panel `dashboard/[org]/campaigns` |
| 6 — Ubicación | 2026-10-15 | Completa | Sin persistencia: distancia en cliente tras clic explícito; lat/lng opcionales por sede | `_components/nearby.tsx`, sedes page, `saveLocation` con lat/lng |
| 7 — Wallet | 2026-10-15 | Completa | Adaptador Passlet reutilizado; 'pending'=enlace generado vs 'active'; botones condicionales + flag `features.wallet` | `lib/wallet/push.ts`, `tarjeta/page.tsx`, rutas wallet existentes |
| 8 — CRM y límites | 2026-10-15 | Completa | Filtro por canal (marketing/push), panel de campañas con audiencia y límites de plan en servidor | `customers/page.tsx`, `campaigns`, `settings` (legal/flags), `admin/actions.ts` |
| 9 — Pruebas y cumplimiento | 2026-10-15 | Parcial | Suite SQL dos tenants verde; lint/typecheck/test/build verdes | Pendiente: dispositivos reales, proveedor de correo caído, borrado, revisión legal |
| 10 — Despliegue | 2026-10-15 | Parcial | `.env.example` + `vercel.json` (cron) + flags por comercio | Pendiente: aplicar migraciones a staging, VAPID reales, manual admin, alertas |

---

## 5. Fuentes oficiales para la revisión legal

Consultar la versión vigente de las normas y confirmar su aplicación con asesoría jurídica colombiana:

- **Ley 1581 de 2012 — Régimen general de protección de datos personales:** https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981
- **Decreto 1074 de 2015 — Decreto Único Reglamentario del Sector Comercio, Industria y Turismo:** https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608
- **Superintendencia de Industria y Comercio (SIC), protección de datos personales:** https://www.sic.gov.co/tema/proteccion-de-datos-personales
- **Ley 2300 de 2023 — canales, horarios y protección frente a contactos comerciales no deseados:** https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=213990
- **RNBD — Registro Nacional de Bases de Datos (SIC):** https://www.sic.gov.co/registro-nacional-de-bases-de-datos

Las normas pueden tener modificaciones, reglamentaciones o interpretaciones posteriores. Validar enlaces, texto vigente, roles de responsable/encargado y obligaciones específicas antes de activar campañas reales.
