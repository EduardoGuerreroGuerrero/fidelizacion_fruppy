// Plantilla por defecto de la política de tratamiento de datos personales,
// precargada en Configuración → Privacidad y editable por cada comercio.
// Se redacta reconociendo DOS responsables frente al titular, conforme a la
// Ley 1581 de 2012 y el Decreto 1377 de 2013 (Colombia):
//
//  - El COMERCIO es el Responsable del Tratamiento: decide para qué usa los
//    datos de sus clientes (operar su programa de fidelización) y responde
//    ante el titular y la SIC por esas decisiones.
//  - PineappleLoyalty opera como Encargado del Tratamiento: almacena y
//    procesa los datos por cuenta e instrucción del comercio, con medidas de
//    seguridad técnicas (cifrado en tránsito, control de acceso por
//    organización, auditoría) y contractuales, sin poder usarlos con fines
//    propios ni cedérselos a terceros ajenos al servicio.
//
// Este texto es un punto de partida razonable, no asesoría legal: el
// comercio puede editarlo libremente y debería validarlo con su asesor legal
// antes de operar a gran escala o tratar datos sensibles.
export function defaultPolicyText(orgName: string): string {
  return `POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES — ${orgName}

1. Responsables del tratamiento
${orgName} (en adelante, "el Comercio") es el Responsable del Tratamiento de
los datos personales que usted entrega al registrarse en su programa de
fidelización: decide para qué se usan y responde por ello ante usted y ante
la Superintendencia de Industria y Comercio.

PineappleLoyalty actúa como Encargado del Tratamiento: presta la plataforma
tecnológica que almacena y procesa esos datos por cuenta e instrucción del
Comercio, bajo un acuerdo de confidencialidad y seguridad. PineappleLoyalty
no utiliza sus datos con fines propios ni los vende ni cede a terceros
ajenos al servicio.

2. Datos que se recolectan
Nombre, correo electrónico y, opcionalmente, teléfono y fecha de nacimiento;
además, su historial de visitas, sellos o puntos acumulados y canjes
realizados en el programa del Comercio. Si usted activa funciones
opcionales (ubicación, notificaciones push), también se procesan los datos
estrictamente necesarios para esas funciones, nunca de forma obligatoria.

3. Finalidades del tratamiento
 a) Administrar su cuenta y tarjeta de fidelización (registrar visitas,
    acumular sellos/puntos, permitir el canje de recompensas).
 b) Enviarle la confirmación de registro y las comunicaciones operativas de
    su tarjeta (por ejemplo, cambios en su saldo).
 c) Si usted lo autorizó expresamente, enviarle comunicaciones comerciales
    y promocionales del Comercio.
 d) Generar la tarjeta digital en Google Wallet o Apple Wallet si usted
    decide guardarla.
 e) Atender sus solicitudes de acceso, actualización, rectificación o
    supresión de datos (derechos ARCO).

4. Responsabilidades frente al titular
El Comercio responde por: definir y comunicar las finalidades del
tratamiento, obtener y conservar su autorización, atender sus solicitudes
de derechos ARCO y decidir cuánto tiempo conserva su información.

PineappleLoyalty responde por: la seguridad técnica de la plataforma donde
se almacenan sus datos (cifrado en tránsito, control de acceso restringido
por comercio, registro de auditoría de accesos administrativos), por no
usar su información con fines distintos a prestar el servicio al Comercio,
y por apoyar al Comercio en la atención oportuna de sus solicitudes.

5. Sus derechos
Como titular de los datos, usted puede en cualquier momento:
 - Conocer, actualizar y rectificar su información.
 - Solicitar prueba de la autorización otorgada.
 - Ser informado sobre el uso dado a sus datos.
 - Revocar la autorización y/o solicitar la supresión de sus datos, cuando
   no exista un deber legal o contractual que impida eliminarlos.
 - Acceder gratuitamente a sus datos personales tratados.

Para ejercer estos derechos puede usar la sección "Derechos" dentro de su
tarjeta digital, o escribir directamente al Comercio al correo de contacto
indicado en esta página.

6. Vigencia
Sus datos se conservarán mientras su cuenta en el programa esté activa y,
posteriormente, durante el término necesario para atender obligaciones
legales, contables o de defensa ante autoridades. Esta política puede ser
actualizada por el Comercio; la versión vigente es la que se muestra aquí.`;
}
