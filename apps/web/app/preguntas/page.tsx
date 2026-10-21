import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../_landing/shell";
import { IconChevronDown } from "../_landing/icons";
import { OpenOnHash } from "./open-on-hash";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | PineappleLoyalty",
  description:
    "Respuestas sobre registro por QR, Google Wallet, planes, datos y cancelación en PineappleLoyalty.",
};

const FAQS = [
  {
    id: "app-cliente",
    q: "¿Mis clientes necesitan descargar una aplicación?",
    a: "No. Se registran escaneando un código QR desde la cámara del celular y su tarjeta vive en Google Wallet. No hay que instalar nada adicional.",
  },
  {
    id: "registro",
    q: "¿Cómo se registran mis clientes?",
    a: "Escanean el QR de tu comercio, completan un formulario breve (nombre, correo y datos opcionales que tú definas) y reciben su tarjeta digital al instante.",
  },
  {
    id: "puntos-sellos",
    q: "¿Cómo funciona el programa de puntos o sellos?",
    a: "Tú defines la regla: cuántas visitas o puntos acumula el cliente y qué recompensa recibe al completarla. El panel muestra el saldo y el canje en tiempo real.",
  },
  {
    id: "wallet",
    q: "¿Google Wallet está disponible?",
    a: "Sí. La tarjeta digital del cliente se puede añadir a Google Wallet desde el flujo de registro, con el nombre, logo y colores de tu comercio.",
  },
  {
    id: "planes",
    q: "¿Qué incluye cada plan?",
    a: "Gratis: 1 programa, hasta 50 clientes, QR de registro y reportes básicos. Pro: programas y clientes ilimitados, notificaciones, campañas y reportes avanzados. Business: multi-sede, roles de equipo e integraciones.",
  },
  {
    id: "promociones",
    q: "¿Puedo enviar promociones a mis clientes?",
    a: "Sí. Puedes enviar notificaciones y correos solo a tus propios clientes que hayan autorizado la comunicación. Nunca a clientes de otros comercios.",
  },
  {
    id: "datos",
    q: "¿Cómo se protegen los datos personales?",
    a: "Aplicamos cifrado en tránsito, aislamiento por organización y auditoría de accesos, conforme a la Ley 1581 de 2012. Los detalles completos están en la política de tratamiento de datos.",
  },
  {
    id: "cancelar",
    q: "¿Puedo cancelar mi suscripción?",
    a: "Sí, en cualquier momento desde el panel de tu organización, sin permanencia mínima.",
  },
];

export default function PreguntasPage() {
  return (
    <PageShell>
      <OpenOnHash />
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
            id={item.id}
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
