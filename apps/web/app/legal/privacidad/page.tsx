import type { Metadata } from "next";
import { LegalDoc } from "../_doc";

export const metadata: Metadata = {
  title: "Aviso de privacidad | PineappleLoyalty",
  description:
    "Cómo PineappleLoyalty trata los datos personales de comercios registrados y visitantes.",
};

export default function PrivacidadPage() {
  return (
    <LegalDoc
      title="Aviso de privacidad"
      updated="octubre de 2026"
      intro="Este aviso informa qué datos personales recolecta PineappleLoyalty como responsable directo, con qué fines y cómo ejercer tus derechos. La política completa está en Tratamiento de datos."
      sections={[
        {
          title: "Datos que recolectamos",
          body: "De los comercios registrados: nombre del responsable, correo electrónico, datos del negocio y datos de facturación. De los visitantes del sitio: datos técnicos mínimos de navegación necesarios para operar la página. No usamos cookies publicitarias ni de terceros.",
        },
        {
          title: "Finalidades",
          body: "Crear y administrar la cuenta del comercio, prestar el servicio contratado, brindar soporte, mantener la seguridad de la plataforma, facturar y cumplir obligaciones legales. No vendemos ni cedemos datos personales a terceros ajenos al servicio.",
        },
        {
          title: "Datos de clientes finales",
          body: "Los datos de los clientes de cada comercio (registro por QR, visitas, puntos) son responsabilidad del comercio, que actúa como Responsable del Tratamiento. PineappleLoyalty los procesa únicamente como Encargado, por cuenta e instrucción del comercio.",
        },
        {
          title: "Tus derechos",
          body: "Como titular puedes consultar, actualizar, rectificar o suprimir tus datos, y revocar la autorización. Las solicitudes se ejercen desde el panel de la cuenta o por el canal de contacto indicado en la política de tratamiento de datos.",
        },
        {
          title: "Conservación y seguridad",
          body: "Conservamos los datos mientras la cuenta esté activa y por los plazos legales aplicables. Aplicamos cifrado en tránsito, control de acceso por organización y registro de auditoría.",
        },
      ]}
    />
  );
}
