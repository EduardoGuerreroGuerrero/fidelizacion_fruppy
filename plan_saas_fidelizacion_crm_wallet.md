# Plan de ejecución — SaaS de fidelización, CRM y tarjetas digitales

> **Objetivo:** construir una plataforma SaaS multiempresa inspirada en la experiencia de Elune, con CRM, programas de fidelización, QR, Apple Wallet y Google Wallet.
>
> **Regla de ejecución:** trabajar por fases pequeñas, verificables y reversibles. No declarar una fase terminada sin pruebas y evidencia. No copiar diseño, marca, textos ni código propietario de Elune.

---

## 0. Instrucciones para el agente

Actúa como ingeniero de software sénior, arquitecto SaaS y responsable de seguridad. Debes inspeccionar el código real antes de modificarlo y mantener al usuario informado con resúmenes claros.

### Reglas obligatorias

1. **Audita antes de construir.** No des por hecho que un repositorio está completo, seguro, actualizado o listo para producción solo por su README.
2. **Verifica licencias y dependencias.** Conserva avisos de copyright y licencias. No incorpores código con licencia incompatible con el modelo comercial previsto sin documentar las obligaciones y pedir aprobación.
3. **No expongas secretos.** Nunca imprimas ni commits tokens, contraseñas, claves privadas, certificados, claves de Supabase ni archivos `.env`.
4. **Multi-tenancy desde el principio.** Toda consulta y mutación de datos de negocio debe respetar `organization_id` y las políticas RLS.
5. **Servidor como frontera de confianza.** No confíes en `organization_id`, roles, puntos, precios, recompensas ni permisos enviados por el navegador.
6. **Ledger auditable.** Los puntos y sellos deben registrarse como movimientos inmutables; las correcciones se representan con movimientos compensatorios, no editando el historial.
7. **Operaciones atómicas.** Otorgar puntos/sellos y canjear recompensas debe ocurrir en transacciones SQL o funciones RPC seguras, evitando doble canje y saldos negativos.
8. **Wallet no es la fuente de verdad.** Supabase/PostgreSQL mantiene el estado; Apple Wallet y Google Wallet solo reflejan ese estado.
9. **No sobrearquitecturar.** Comenzar con un monolito modular Next.js y Supabase. No añadir microservicios, Redis, colas externas ni IA hasta que exista una necesidad demostrada.
10. **No realizar acciones externas costosas o irreversibles sin aprobación:** desplegar en producción, enviar campañas reales, comprar dominios/servicios, borrar datos, cambiar proyectos remotos o emitir tarjetas reales.
11. **Pruebas obligatorias.** Ejecutar lint, typecheck, pruebas unitarias, pruebas de base de datos y build cuando existan. Informar con honestidad los fallos.
12. **Documentar decisiones.** Mantener `docs/DECISIONS.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md` y `docs/ROADMAP.md`.

### Entrega de cada fase

Al terminar cada fase, informar:
- qué cambió;
- archivos principales modificados;
- comandos ejecutados y resultado;
- pruebas que pasaron/fallaron;
- riesgos y decisiones pendientes;
- siguiente fase propuesta.

No pasar a la siguiente fase si existen fallos críticos de seguridad o integridad de datos.

---

## 1. Producto y alcance

### Propuesta

Un SaaS para que comercios locales creen programas de fidelización, administren clientes y recompensas y entreguen tarjetas digitales que los clientes puedan abrir desde el navegador o guardar en Apple Wallet/Google Wallet.

### Usuarios y roles

- **Platform Admin:** administración global del SaaS; acceso excepcional, auditado y restringido.
- **Organization Owner:** propietario del negocio y sus sedes.
- **Organization Admin:** administra configuración, personal, clientes y programas.
- **Manager:** supervisa sedes, clientes, campañas y reportes según permisos.
- **Staff:** registra visitas/compras y canjea recompensas con permisos limitados.
- **Customer:** consulta su tarjeta, puntos/sellos, historial y recompensas disponibles.

### MVP incluido

1. Registro/inicio de sesión del comercio.
2. Organización y sede inicial.
3. Invitación/gestión básica de personal y roles.
4. CRM básico: clientes, búsqueda, ficha e historial.
5. Programa de sellos y programa de puntos (al menos uno funcional primero; diseñar el modelo para ambos).
6. QR por cliente, con identificador opaco y no predecible.
7. Registro seguro de visitas/compras.
8. Canje de recompensas.
9. Tarjeta web responsive/PWA ligera.
10. Integración Apple Wallet y Google Wallet, habilitada solo cuando existan credenciales y configuración válida.
11. Dashboard con clientes, visitas, puntos/sellos y canjes.
12. Auditoría de acciones sensibles.
13. Aislamiento multiempresa mediante RLS.
14. Exportación CSV segura, si cabe en el alcance tras completar las funciones críticas.

### Fuera del MVP

- Campañas masivas por WhatsApp/SMS/email.
- Automatizaciones avanzadas.
- Integración con POS/e-commerce.
- IA predictiva.
- Marketplace de comercios.
- App móvil nativa.
- Facturación y cobros automáticos SaaS.
- Programa de puntos compartido entre diferentes comercios.

No implementar estas funciones antes de que el flujo principal esté probado con uno o dos comercios piloto.

---

## 2. Repositorios de referencia

### Base candidata para evaluar

- `https://github.com/longlivewama/digital-loyalty-cards`
  - Referencia de flujo Next.js + Supabase + QR + sellos + Apple Wallet + Google Wallet.
  - **No asumir que es multi-tenant ni apto para producción.**
  - Inspeccionar cada migración, política RLS, función SQL, ruta API, middleware, autenticación y actualización de Wallet.
  - Confirmar licencia en el archivo `LICENSE` y metadatos actuales antes de reutilizar código.

### Biblioteca Wallet candidata

- `https://github.com/oscartrevio/passlet`
  - Biblioteca TypeScript con licencia MIT declarada en el repositorio consultado.
  - Evaluar compatibilidad, estado de mantenimiento, versión publicada, tests, credenciales y actualización de pases.
  - Preferir usarla como dependencia aislada detrás de una interfaz propia, no acoplar el dominio de negocio a su API.

### Referencia de arquitectura, no copiar automáticamente

- `https://github.com/Starfiniti/starfiniti-loyalty`
  - Declara AGPL-3.0-or-later para la plataforma y GPL-2.0-or-later para el conector WooCommerce.
  - Estudiar conceptos de multi-tenancy, RLS, ledger y pruebas.
  - No copiar código a un producto propietario sin evaluación legal y aprobación explícita.

### Referencia de integración

- `https://github.com/PassKit/passkit-node-quickstart`
  - Ejemplos de integración con el servicio PassKit.
  - Distinguir entre usar el proveedor PassKit y emitir pases directamente con Apple/Google. Son estrategias distintas; no mezclarlas accidentalmente.

### Regla de selección

En la Fase 0, compara al menos estas opciones:

A. Extender `digital-loyalty-cards` tras auditoría.  
B. Crear aplicación limpia y reutilizar solo patrones/librerías compatibles.  
C. Usar PassKit como proveedor externo de emisión y gestión de Wallet.

Elige una opción según seguridad, licencia, coste operativo, facilidad de mantenimiento y tiempo de entrega. Documenta los motivos en `docs/DECISIONS.md`. No declares que una licencia es compatible con uso comercial sin comprobar los términos concretos.

---

## 3. Arquitectura objetivo

### Stack inicial

- **Aplicación:** Next.js App Router + TypeScript.
- **UI:** Tailwind CSS y biblioteca de componentes accesible (elegir una tras revisar el repo).
- **Datos:** Supabase PostgreSQL.
- **Autenticación del comercio:** Supabase Auth.
- **Seguridad de datos:** Row Level Security (RLS), políticas restrictivas y pruebas de aislamiento.
- **Lógica de negocio:** módulos TypeScript de servidor y funciones SQL/RPC para operaciones atómicas.
- **Wallet:** adaptador propio con una implementación Apple y otra Google; evaluar Passlet o PassKit.
- **QR:** biblioteca mantenida que genere QR; el QR no contiene datos personales ni privilegios.
- **Hosting:** escoger después de validar los requisitos de runtime de Next.js, Apple Wallet, tareas programadas y variables secretas.
- **Observabilidad:** logs estructurados sin datos sensibles y seguimiento de errores.

### Principios

- Monolito modular primero.
- Un solo origen de verdad para el saldo.
- Validación de entrada en servidor.
- Autorización por organización, sede y rol.
- Todas las tablas de negocio deben incluir `organization_id` directamente o estar vinculadas inequívocamente a una tabla que lo tenga.
- Fechas en UTC en almacenamiento; mostrar zona horaria local del negocio.
- Importes monetarios como enteros en unidades menores (por ejemplo, centavos) o `numeric`, nunca `float`.
- Idempotencia para operaciones que puedan reintentarse.
- No guardar datos de tarjetas de pago; no es parte del producto.

---

## 4. Modelo de datos inicial

El agente debe ajustar el modelo después de inspeccionar las migraciones del repositorio base. Crear migraciones versionadas y reproducibles.

### Tablas propuestas

#### `organizations`
- `id`
- `name`
- `slug`
- `status` (`trial`, `active`, `suspended`)
- `timezone`
- `currency` (por defecto `COP`)
- `created_at`, `updated_at`

#### `organization_members`
- `id`
- `organization_id`
- `user_id` (referencia a Supabase Auth)
- `role` (`owner`, `admin`, `manager`, `staff`)
- `status`
- `created_at`

Restricción única: `(organization_id, user_id)`.

#### `locations`
- `id`
- `organization_id`
- `name`
- `address` opcional
- `timezone`
- `status`

#### `customers`
- `id`
- `organization_id`
- `external_ref` o identificador público aleatorio
- `first_name`
- `last_name`
- `email` opcional
- `phone` opcional
- `birth_date` opcional
- `marketing_consent_at` opcional
- `status`
- `created_at`, `updated_at`

Reglas: minimizar los datos personales; normalizar teléfono/email; no exigir datos no necesarios.

#### `loyalty_programs`
- `id`
- `organization_id`
- `name`
- `program_type` (`points` o `stamps`)
- `status`
- `points_per_currency_unit` o regla equivalente
- `stamp_goal`
- `reward_description`
- `expiration_policy` opcional
- `created_at`, `updated_at`

Definir reglas inequívocas para redondeo, reversos, vencimiento y cambios de programa. Los cambios de reglas no deben reescribir movimientos históricos.

#### `loyalty_accounts`
- `id`
- `organization_id`
- `customer_id`
- `program_id`
- `current_points` o `current_stamps` como proyección/cache controlada por transacción SQL
- `version`
- `created_at`, `updated_at`

Unicidad apropiada para cliente/programa. El ledger es la fuente auditable; cualquier saldo materializado debe actualizarse atómicamente con el ledger.

#### `loyalty_transactions`
- `id`
- `organization_id`
- `account_id`
- `transaction_type` (`earn`, `redeem`, `adjustment`, `expire`, `reversal`)
- `points_delta` o `stamps_delta`
- `amount_minor` opcional
- `location_id` opcional
- `performed_by`
- `idempotency_key`
- `reference_transaction_id` opcional
- `reason` opcional
- `created_at`

No permitir editar o borrar movimientos ordinarios desde el cliente. Corregir mediante reverso/ajuste auditado. Índices por organización, cuenta y fecha.

#### `rewards`
- `id`
- `organization_id`
- `program_id`
- `name`
- `description`
- `cost_points` o `cost_stamps`
- `status`
- `terms`
- `created_at`, `updated_at`

#### `redemptions`
- `id`
- `organization_id`
- `customer_id`
- `reward_id`
- `account_id`
- `location_id`
- `performed_by`
- `status`
- `idempotency_key`
- `created_at`
- `reversed_at` opcional

#### `customer_visits`
- `id`
- `organization_id`
- `customer_id`
- `location_id`
- `performed_by`
- `source` (`staff_qr`, `manual`, futuro `pos`)
- `purchase_amount_minor` opcional
- `idempotency_key`
- `created_at`

#### `wallet_passes`
- `id`
- `organization_id`
- `customer_id`
- `program_id`
- `provider` (`apple`, `google`, `passkit`)
- `provider_object_id` opcional
- `serial_number` o identificador equivalente
- `status`
- `last_synced_at`
- `last_sync_error_code` sin secretos
- `created_at`, `updated_at`

Nunca guardar claves privadas, JWT de larga duración o secretos de proveedor en esta tabla.

#### `audit_logs`
- `id`
- `organization_id` opcional para acciones globales
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata` filtrada y sin PII innecesaria
- `created_at`

#### Futuras tablas, no necesarias para el primer release
- `campaigns`
- `campaign_deliveries`
- `subscriptions`
- `billing_events`
- `webhook_events`
- `integration_connections`

---

## 5. Seguridad y políticas RLS

Implementar y probar antes de cargar datos reales.

1. Activar RLS en todas las tablas expuestas por Supabase Data API.
2. Los usuarios solo pueden leer datos de organizaciones en las que tienen membresía activa.
3. `staff` solo puede realizar las acciones explícitamente permitidas.
4. `manager` no puede modificar propietario, facturación ni ajustes globales.
5. Los clientes no pueden cambiar saldo, recompensas, rol, `organization_id` ni estado de canje.
6. El rol `service_role` nunca llega al navegador ni a variables `NEXT_PUBLIC_*`.
7. Las operaciones de puntos/sellos y canje se ejecutan mediante funciones seguras, con autorización comprobada en servidor/SQL.
8. Añadir pruebas negativas: usuario de organización A intenta leer, modificar, canjear o adivinar datos de organización B; todas deben fallar.
9. Rate limiting y bloqueo progresivo para PIN/login y endpoints de QR.
10. El QR identifica, pero no autoriza por sí solo una acción privilegiada. Exigir sesión válida del empleado para registrar puntos o canjes.
11. Evitar IDOR: validar organización y permisos en cada ruta/acción, no solo en la interfaz.
12. Prevenir replay/doble canje con idempotencia y transacciones atómicas.
13. CSV: neutralizar fórmulas de hoja de cálculo y aplicar autorización por organización.
14. Definir retención, eliminación/exportación de datos y consentimiento de marketing según normativa aplicable en Colombia, incluida la Ley 1581 de 2012 y sus reglas relacionadas. No presentar la app como asesoría legal; dejar revisión jurídica para el lanzamiento.

---

## 6. Fases de ejecución

## Fase 0 — Auditoría y decisión de base

**Objetivo:** elegir una base técnica segura y legalmente reutilizable.

### Tareas
- Inspeccionar `digital-loyalty-cards`: `README`, `LICENSE`, `package.json`, lockfile, migraciones, políticas RLS, SQL functions, APIs, middleware, auth, QR, Wallet, tests y despliegue.
- Inspeccionar Passlet: licencia, versión publicada, changelog, compatibilidad de Node, APIs de actualización y tests.
- Inspeccionar Starfiniti solo como referencia arquitectónica; no copiar código AGPL/GPL.
- Revisar issues y actividad reciente, sin interpretar actividad como garantía de calidad.
- Ejecutar instalación limpia, lint, typecheck, pruebas y build, si el entorno lo permite.
- Hacer threat model corto: multi-tenant, saldo, canje, QR, secretos y Wallet.
- Elaborar matriz de decisión A/B/C descrita arriba.
- Crear `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`.

### Criterio de aceptación
- Licencias y obligaciones documentadas.
- Riesgos críticos identificados.
- Opción técnica seleccionada y justificada.
- Estado de pruebas reproducido o limitaciones documentadas.
- No hay secretos en el repositorio.

**No avanzar** si no se entiende cómo se protege el saldo o si el aislamiento entre comercios no puede garantizarse.

## Fase 1 — Base del proyecto y entorno

### Tareas
- Crear fork privado o repositorio propio según licencia y decisión de Fase 0.
- Configurar ramas y protección de `main`.
- Crear `.env.example` con nombres de variables, sin valores secretos.
- Configurar TypeScript estricto, lint, formato y scripts de test.
- Configurar entornos local, preview y producción sin compartir credenciales.
- Configurar Supabase local y migraciones reproducibles.
- Añadir CI para lint, typecheck, tests y build.
- Crear página de salud no sensible y manejo de errores.

### Criterio de aceptación
- Instalación reproducible desde README.
- CI pasa en un commit limpio.
- Ningún secreto versionado.
- Migraciones se aplican desde una base vacía.

## Fase 2 — Identidad, organizaciones y aislamiento

### Tareas
- Registro/login/logout con Supabase Auth.
- Flujo de creación de organización.
- Membresía de propietario.
- Sedes y roles básicos.
- RLS para todas las tablas iniciales.
- Middleware/guards de rutas privadas.
- Pruebas de acceso cruzado entre organizaciones.

### Criterio de aceptación
- Usuario A no puede leer ni modificar ningún registro de B, incluso llamando directamente a APIs.
- El frontend no es la única capa de autorización.
- Cambios de rol y membresía quedan auditados.

## Fase 3 — CRM básico

### Tareas
- Listado, búsqueda, filtros y ficha de cliente.
- Alta/edición con validación de servidor.
- Historial cronológico de visitas y transacciones.
- Detección de duplicados por teléfono/email dentro de la organización, sin fusionar automáticamente.
- Exportación CSV solo después de aplicar controles y pruebas de fórmula.
- Registrar consentimiento de marketing de forma separada.

### Criterio de aceptación
- CRUD autorizado por rol.
- Historial no se puede falsificar desde el cliente.
- No se filtran datos de otros negocios.

## Fase 4 — Motor de fidelización

### Tareas
- Implementar un tipo primero (sellos recomendado para validar la base) y preparar extensibilidad para puntos.
- Definir programa, meta y recompensa.
- Implementar función SQL transaccional para añadir sellos/puntos.
- Implementar canje atómico y registro de redención.
- Crear ledger inmutable y reversos.
- Idempotencia en operaciones de escritura.
- Evitar saldos negativos y doble canje concurrente.
- Añadir pruebas de concurrencia y reglas límite.
- Mantener una proyección de saldo solo si se actualiza en la misma transacción.

### Criterio de aceptación
- Reintentar una solicitud no duplica puntos.
- Dos canjes simultáneos no canjean una recompensa dos veces.
- Cada saldo puede reconciliarse contra el ledger.
- Correcciones dejan trazabilidad.

## Fase 5 — QR y flujo de empleado

### Tareas
- Generar token público aleatorio y revocable para cada tarjeta.
- QR no debe incluir email, teléfono, puntos ni credenciales.
- Página de cliente con estado y tarjeta.
- Flujo empleado: escanear/buscar cliente, validar sesión/rol, registrar visita y puntos/sellos.
- Confirmación visual de éxito/error.
- Rate limiting y protección contra abuso.
- Registro de empleado, sede, fecha y acción en cada movimiento.

### Criterio de aceptación
- El QR no permite modificar el saldo sin autorización del empleado.
- Tokens revocados dejan de funcionar.
- Las operaciones quedan asociadas al usuario y sede correctos.

## Fase 6 — Tarjeta web y Wallet

### Tareas
- Diseñar una tarjeta web responsive como alternativa sin Wallet.
- Implementar interfaz interna `WalletProvider` con operaciones como `createPass`, `updatePass`, `revokePass` y `healthCheck`.
- Implementar primero un proveedor y después el segundo; mantener estado de sincronización separado del ledger.
- Configurar credenciales Apple y Google fuera del repositorio.
- Implementar creación y actualización de pases.
- Diseñar reintentos idempotentes y recuperación de fallos.
- Los fallos de Wallet no deben revertir puntos ni canjes.
- Guardar únicamente identificadores y estado técnico en `wallet_passes`.
- Probar con cuentas de prueba y dispositivos reales antes de anunciar compatibilidad.

### Criterio de aceptación
- Una transacción actualiza el estado de la tarjeta en base de datos aunque Wallet esté temporalmente caído.
- Las actualizaciones de Wallet son recuperables.
- Los secretos no aparecen en logs.
- Apple y Google muestran el mismo saldo que la base de datos.

## Fase 7 — Dashboard y configuración del comercio

### Pantallas
- Inicio: clientes, visitas, recompensas y actividad reciente.
- Clientes: tabla, búsqueda y perfil.
- Programas: crear/editar programa y reglas.
- Recompensas: catálogo y canjes.
- Personal: invitaciones y roles.
- Sedes: gestión básica.
- Tarjeta: branding y vista previa.
- Configuración: nombre, logo, colores, moneda y zona horaria.
- Auditoría: movimientos y acciones sensibles.

### Criterio de aceptación
- Diseño responsive y accesible.
- Estados vacíos, carga, error y éxito implementados.
- Las cifras provienen de consultas reales, no de datos ficticios en producción.
- Todas las acciones verifican permisos en servidor.

## Fase 8 — Analítica básica

### Métricas
- clientes registrados;
- clientes activos en período;
- visitas por día/semana/mes;
- recompensas emitidas y canjeadas;
- puntos/sellos otorgados y canjeados;
- tasa de retorno, definiendo claramente la fórmula;
- ventas/ticket promedio solo cuando haya datos de compra fiables.

### Criterio de aceptación
- Definiciones documentadas.
- Fechas y zona horaria consistentes.
- Métricas reconciliables con registros de origen.
- No presentar ventas ni LTV si no hay datos suficientes.

## Fase 9 — Piloto con comercios

### Tareas
- Usar primero un negocio piloto y datos de prueba.
- Ejecutar escenarios completos: alta, QR, visita, acumulación, canje, corrección, baja de empleado y recuperación Wallet.
- Observar logs y errores.
- Medir facilidad de registro y tiempo de atención.
- Corregir errores antes de ampliar el piloto.
- Obtener consentimiento para cualquier dato real de cliente.

### Criterio de aceptación
- Ningún bug crítico de aislamiento o saldo.
- Flujo de punta a punta probado.
- Backups y restauración verificados.
- Procedimiento de soporte documentado.

## Fase 10 — SaaS comercial

**No comenzar hasta validar el MVP.**

### Tareas futuras
- Planes, límites y suscripciones.
- Integración de pagos recurrentes.
- Portal de facturación y cancelación.
- Límites por clientes activos, sedes, campañas y funciones.
- Emails transaccionales.
- Campañas y automatizaciones.
- WhatsApp mediante proveedor oficial y consentimiento adecuado.
- Importación CSV con validación y deduplicación.
- Política de privacidad, términos, acuerdo de tratamiento de datos y proceso de eliminación.
- Backups, recuperación, monitoreo y alertas.

### Criterio de aceptación
- Límites verificados en servidor.
- Cancelación y exportación de datos disponibles.
- Costos por comercio medidos.
- Soporte y proceso de incidentes definidos.

---

## 7. API y módulos de dominio sugeridos

Ajustar a los patrones del proyecto seleccionado; no crear endpoints duplicados si el repo ya tiene equivalentes seguros.

### Módulos
- `organizations`
- `memberships`
- `locations`
- `customers`
- `loyalty-programs`
- `loyalty-ledger`
- `rewards`
- `redemptions`
- `visits`
- `qr`
- `wallet`
- `analytics`
- `audit`

### Operaciones conceptuales
- `createOrganization`
- `inviteMember`
- `createCustomer`
- `getCustomerProfile`
- `createLoyaltyProgram`
- `recordVisit`
- `earnPointsOrStamps`
- `redeemReward`
- `reverseTransaction`
- `issueWalletPass`
- `syncWalletPass`
- `revokeWalletPass`
- `getOrganizationMetrics`

Las operaciones sensibles deben ejecutarse en servidor o funciones SQL seguras. Nunca exponer una función administrativa sin autorización.

---

## 8. UX mínima

### Comercio
- Panel de administración responsive.
- Acciones frecuentes en pocos pasos.
- Escaneo QR optimizado para móvil.
- Búsqueda manual alternativa si la cámara no funciona.
- Confirmación clara de puntos/sellos otorgados y recompensas canjeadas.
- Errores comprensibles sin exponer información interna.

### Cliente
- Landing de registro simple.
- Tarjeta web que carga rápido.
- Saldo y progreso claramente visibles.
- Botones para añadir a Apple Wallet/Google Wallet solo cuando estén configurados.
- Historial básico.
- Aviso de privacidad y consentimiento separado para marketing.

### Diseño
Crear identidad propia. No reutilizar logos, capturas, nombres, textos ni assets de Elune. El producto debe ser original aunque tome como referencia patrones comunes de SaaS.

---

## 9. Despliegue y operaciones

- Separar local, staging y producción.
- No usar credenciales de producción en desarrollo.
- Ejecutar migraciones de producción con revisión y backup previo.
- Configurar backups automáticos y probar restauración.
- Configurar dominios y HTTPS.
- Guardar secretos en el gestor del hosting.
- Verificar que el runtime de hosting soporta generación de archivos `.pkpass`, dependencias nativas y tareas requeridas.
- Configurar alertas para fallos de sincronización Wallet, errores API y anomalías en canjes.
- Tener procedimiento para rotar credenciales y revocar tarjetas comprometidas.
- No activar campañas reales durante pruebas.

---

## 10. Orden de trabajo recomendado

El agente debe ejecutar exactamente en este orden:

1. Fase 0: auditoría de repositorios, licencia y arquitectura.
2. Presentar conclusiones y decisión propuesta al usuario.
3. Esperar aprobación antes de crear un fork público, copiar código de licencia dudosa o cambiar recursos remotos.
4. Fases 1–2: base y multi-tenancy seguro.
5. Fases 3–5: CRM, motor loyalty y QR.
6. Fase 6: Wallet.
7. Fases 7–8: dashboard y métricas.
8. Fase 9: piloto.
9. Fase 10: monetización y marketing avanzado.

Si el agente dispone de acceso a GitHub, puede inspeccionar repositorios y crear ramas de trabajo. No debe publicar el proyecto, abrirlo al público ni cambiar permisos sin aprobación explícita.

---

## 11. Definición de “MVP listo”

El MVP se considera listo para piloto únicamente cuando:

- [ ] un comercio puede crear su organización y configurar su programa;
- [ ] puede registrar personal con roles limitados;
- [ ] puede dar de alta clientes;
- [ ] un empleado autenticado puede escanear QR y registrar una visita;
- [ ] los puntos/sellos se contabilizan mediante operaciones atómicas;
- [ ] se puede canjear una recompensa sin doble canje;
- [ ] existe historial auditable;
- [ ] el cliente puede consultar su tarjeta web;
- [ ] Apple Wallet y Google Wallet funcionan en entornos de prueba o el proveedor elegido está documentado como dependencia pendiente;
- [ ] el aislamiento entre dos organizaciones está probado con tests negativos;
- [ ] no hay secretos en el repositorio ni en logs;
- [ ] lint, typecheck, tests y build pasan;
- [ ] backups y restauración están probados;
- [ ] la política de privacidad y el consentimiento están listos para revisión antes de usar datos reales.

---

## 12. Primer prompt que debe ejecutar el agente

Comienza **solo con la Fase 0**. No desarrolles funcionalidades todavía.

1. Inspecciona los repositorios enlazados y comprueba su estado actual, licencias, dependencias, migraciones, seguridad, tests y compatibilidad.
2. En `digital-loyalty-cards`, revisa específicamente las funciones SQL de puntos/canjes, RLS, autenticación del staff, generación del QR y actualización de Apple/Google Wallet.
3. En Passlet, comprueba la licencia, API publicada, requisitos de credenciales y mecanismos de actualización.
4. En Starfiniti, estudia únicamente los patrones arquitectónicos que puedan documentarse sin copiar código AGPL/GPL.
5. Ejecuta las verificaciones que sea seguro ejecutar localmente y registra los resultados reales.
6. Compara:
   - A: extender el repositorio de loyalty existente;
   - B: crear un proyecto propio reutilizando solo componentes compatibles;
   - C: usar PassKit como servicio de Wallet.
7. Entrega una tabla con: repo, función, licencia comprobada, madurez observada, riesgos, reutilización posible y decisión.
8. Escribe los documentos de auditoría y la arquitectura propuesta.
9. No crees repositorios públicos, no despliegues y no modifiques recursos de producción.
10. Al finalizar, presenta el informe y solicita aprobación antes de la Fase 1.

**Prioridad absoluta:** seguridad multiempresa, integridad del ledger, licencias y una base mantenible. No sacrificar estos requisitos por terminar más rápido.
