import type { Metadata } from "next";
import { LegalDoc } from "../_doc";

export const metadata: Metadata = {
  title: "Términos y condiciones | PineappleLoyalty",
  description:
    "Condiciones de uso de la plataforma PineappleLoyalty para comercios.",
};

export default function TerminosPage() {
  return (
    <LegalDoc
      title="Términos y condiciones del servicio"
      updated="octubre de 2026"
      intro="Estos términos regulan el uso de PineappleLoyalty, plataforma SaaS que permite a comercios crear y administrar programas de fidelización digitales. Al crear una cuenta, el comercio acepta estas condiciones."
      sections={[
        {
          title: "Objeto del servicio",
          body: "PineappleLoyalty provee herramientas para que un comercio configure un programa de fidelización (puntos o sellos), registre clientes mediante código QR, emita tarjetas digitales compatibles con Google Wallet y administre la relación con sus clientes desde un panel web.",
        },
        {
          title: "La cuenta del comercio",
          body: "El comercio debe registrar información veraz, custodiar sus credenciales de acceso y designar los roles de su equipo. Es responsable de la actividad realizada bajo su cuenta y de notificar cualquier acceso no autorizado.",
        },
        {
          title: "Relación con los clientes finales",
          body: "El comercio es el Responsable del Tratamiento de los datos personales de sus clientes: define las finalidades, obtiene la autorización y atiende sus derechos. PineappleLoyalty actúa como Encargado del Tratamiento, procesando esos datos por cuenta e instrucción del comercio.",
        },
        {
          title: "Planes y facturación",
          body: "Las características, límites y precios de cada plan se informan en la página de precios o en el contrato de suscripción. Los cobros, renovaciones y cambios de plan se rigen por las condiciones aceptadas al contratar.",
        },
        {
          title: "Uso aceptable",
          body: "El comercio se compromete a usar el servicio conforme a la ley: no enviar comunicaciones no autorizadas, no registrar datos sin consentimiento, no tratar datos sensibles sin las medidas exigidas y no revender el acceso a la plataforma.",
        },
        {
          title: "Disponibilidad",
          body: "PineappleLoyalty realiza esfuerzos razonables para mantener el servicio disponible y seguro, pero no garantiza disponibilidad ininterrumpida. Los mantenimientos programados se comunican con anticipación cuando sea posible.",
        },
        {
          title: "Propiedad intelectual",
          body: "La marca, el software y el diseño de PineappleLoyalty son de sus titulares. El contenido que el comercio cargue (logos, textos, imágenes) sigue siendo de su propiedad; el comercio otorga licencia limitada para mostrarlo dentro del servicio.",
        },
        {
          title: "Limitación de responsabilidad",
          body: "PineappleLoyalty no responde por decisiones comerciales del comercio, por el contenido de sus comunicaciones a clientes ni por daños indirectos. La responsabilidad máxima se limita al valor pagado por el servicio en los últimos 12 meses.",
        },
        {
          title: "Terminación",
          body: "El comercio puede cancelar su cuenta en cualquier momento desde el panel. PineappleLoyalty puede suspender cuentas que incumplan estos términos, previa notificación cuando el caso lo permita.",
        },
        {
          title: "Ley aplicable",
          body: "Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia se someterá a los jueces competentes del domicilio de PineappleLoyalty.",
        },
      ]}
    />
  );
}
