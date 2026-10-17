import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../_landing/shell";
import { IconChevronDown } from "../_landing/icons";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | PineappleLoyalty",
  description:
    "Respuestas sobre registro por QR, Google Wallet, planes, datos y cancelación en PineappleLoyalty.",
};

const FAQS = [
  {
    q: "¿Mis clientes necesitan descargar una aplicación?",
    a: "No. Se registran escaneando un código QR desde la cámara del celular y su tarjeta vive en Google Wallet. No hay que instalar nada adicional.",
  },
  {
    q: "¿Cómo se registran mis clientes?",
    a: "Escanean el QR de tu comercio, completan un formulario breve (nombre, correo y datos opcionales que tú definas) y reciben su tarjeta digital al instante.",
  },
  {
    q: "¿Cómo funciona el programa de puntos o sellos?",
    a: "Tú defines la regla: cuántas visitas o puntos acumula el cliente y qué recompensa recibe al completarla. El panel muestra el saldo y el canje en tiempo real.",
  },
  {
    q: "¿Google Wallet está disponible?",
    a: "Sí. La tarjeta digital del cliente se puede añadir a Google Wallet desde el flujo de registro, con el nombre, logo y colores de tu comercio.",
  },
  {
    q: "¿Qué incluye cada plan?",
    a: "Gratis: 1 programa, hasta 100 clientes, QR de registro y reportes básicos. Pro: programas y clientes ilimitados, notificaciones, campañas y reportes avanzados. Business: multi-sede, roles de equipo e integraciones.",
  },
  {
    q: "¿Puedo enviar promociones a mis clientes?",
    a: "Sí. Puedes enviar notificaciones y correos solo a tus propios clientes que hayan autorizado la comunicación. Nunca a clientes de otros comercios.",
  },
  {
    q: "¿Cómo se protegen los datos personales?",
    a: "Aplicamos cifrado en tránsito, aislamiento por organización y auditoría de accesos, conforme a la Ley 1581 de 2012. Los detalles completos están en la política de tratamiento de datos.",
  },
  {
    q: "¿Puedo cancelar mi suscripción?",
    a: "Sí, en cualquier momento desde el panel de tu organización, sin permanencia mínima.",
  },
];

export default function PreguntasPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Preguntas frecuentes
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Respuestas sobre cómo funciona PineappleLoyalty para tu negocio.
      </p>
      <div className="mt-8 space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-neutral-200 bg-white px-5 py-4 open:border-pl-green/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <IconChevronDown className="h-4 w-4 shrink-0 text-ink-soft transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {item.a}
            </p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-soft">
        ¿Otra duda?{" "}
        <Link href="/contacto" className="font-medium text-pl-green">
          Contáctanos
        </Link>{" "}
        o{" "}
        <Link href="/signup" className="font-medium text-pl-green">
          crea tu cuenta gratis
        </Link>
        .
      </p>
    </PageShell>
  );
}
