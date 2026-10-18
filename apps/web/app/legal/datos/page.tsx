import type { Metadata } from "next";
import { LegalDoc } from "../_doc";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos | PineappleLoyalty",
  description:
    "Política de tratamiento de datos personales de PineappleLoyalty conforme a la Ley 1581 de 2012 (Colombia).",
};

export default function DatosPage() {
  return (
    <LegalDoc
      title="Política de tratamiento de datos personales"
      updated="octubre de 2026"
      intro="Política adoptada conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas de protección de datos personales de la República de Colombia."
      sections={[
        {
          title: "Responsable y encargado",
          body: "PineappleLoyalty es Responsable del Tratamiento de los datos personales de los comercios registrados (datos de cuenta y facturación).\n\nFrente a los datos de los clientes finales de cada comercio, el comercio es el Responsable del Tratamiento y PineappleLoyalty actúa como Encargado, procesándolos por cuenta e instrucción del comercio.",
        },
        {
          title: "Datos recolectados",
          body: "Comercios: nombre, correo electrónico, datos del negocio, credenciales de acceso y datos de facturación.\n\nClientes finales (por instrucción del comercio): nombre, correo y, opcionalmente, teléfono; historial de visitas, sellos o puntos y canjes; y datos de funciones opcionales (ubicación, notificaciones push) solo cuando el titular las autoriza.",
        },
        {
          title: "Finalidades",
          body: "a) Crear y administrar la cuenta del comercio y prestar el servicio.\nb) Operar los programas de fidelización del comercio: registro por QR, acumulación de sellos/puntos y canje de recompensas.\nc) Emitir la tarjeta digital en Google Wallet cuando el cliente lo solicita.\nd) Enviar comunicaciones operativas y, con autorización expresa, promocionales.\ne) Atender solicitudes de derechos y cumplir obligaciones legales.\nf) Mantener la seguridad y auditoría de la plataforma.",
        },
        {
          title: "Derechos del titular",
          body: "El titular puede conocer, actualizar, rectificar y suprimir sus datos; revocar la autorización; solicitar prueba de la autorización; y presentar quejas ante la Superintendencia de Industria y Comercio. Los clientes finales ejercen estos derechos ante el comercio responsable; PineappleLoyalty coopera en su atención.",
        },
        {
          title: "Procedimiento ARCO",
          body: "Las consultas se responden en máximo diez (10) días hábiles y los reclamos en máximo quince (15) días hábiles, conforme a la Ley 1581 de 2012. Las solicitudes pueden presentarse por el canal de soporte disponible en el panel de la cuenta, escribiendo a privacidad@pineappleloyalty.com, o ante el comercio responsable, según corresponda.",
        },
        {
          title: "Medidas de seguridad",
          body: "Cifrado en tránsito, aislamiento de datos por organización, control de acceso restringido y registro de auditoría de accesos administrativos.",
        },
        {
          title: "Transferencias y encargados",
          body: "Los datos se almacenan en proveedores de infraestructura que actúan como encargados bajo contratos de confidencialidad y seguridad. No se transfieren datos a terceros ajenos al servicio.",
        },
        {
          title: "Vigencia y cambios",
          body: "La política rige desde su publicación y durante la vigencia de la relación con el titular, más los plazos legales de conservación. Los cambios sustanciales se comunican a los responsables registrados.",
        },
      ]}
    />
  );
}
