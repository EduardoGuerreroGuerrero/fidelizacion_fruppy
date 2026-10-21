import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../../_landing/shell";

export const metadata: Metadata = {
  title: "Cómo enviar una campaña push a tus clientes | PineappleLoyalty",
  description:
    "Guía paso a paso: escribe título y mensaje, programa la fecha si quieres y envía notificaciones push a los clientes que las activaron.",
};

const NEEDS = [
  "Tu cuenta de PineappleLoyalty con el programa activo",
  "Clientes registrados que hayan activado las notificaciones",
  "Una promoción o mensaje claro para enviar",
];

const STEPS: {
  title: string;
  body: React.ReactNode;
  img?: string;
  alt?: string;
}[] = [
  {
    title: "Abre Campañas",
    body: (
      <>
        En el menú <strong>Marketing → Campañas</strong> verás el formulario{" "}
        <strong>Nueva campaña</strong> y la lista de campañas anteriores. Arriba del formulario
        hay un dato clave: la <strong>audiencia elegible</strong> — cuántos clientes tienen las
        notificaciones activadas y pueden recibir tu mensaje.
      </>
    ),
    img: "/recursos/guias/campana-form.webp",
    alt: "Formulario de nueva campaña push con audiencia elegible",
  },
  {
    title: "Escribe el título y el mensaje",
    body: (
      <>
        El <strong>título</strong> es lo primero que verá el cliente en la notificación: sé
        directo (ej. «Feliz semana: sello doble hoy»). El <strong>mensaje</strong> tiene un máximo
        de 300 caracteres — explica la promoción en una frase. Evita mayúsculas sostenidas y
        signos de exclamación repetidos: suenan a spam.
      </>
    ),
  },
  {
    title: "Agrega un enlace y programa la fecha (opcional)",
    body: (
      <>
        En <strong>Enlace</strong> puedes poner una ruta interna (ej. <code>/promociones</code>)
        o una URL completa con <code>https://</code> — al tocar la notificación, el cliente abre
        ese destino. Con <strong>Programar para</strong> eliges fecha y hora local; si lo dejas
        vacío, la campaña queda lista para enviar cuando decidas.
      </>
    ),
  },
  {
    title: "Crea la campaña y revisa su estado",
    body: (
      <>
        Pulsa <strong>Crear campaña</strong>. Aparece en la lista como <strong>Borrador</strong>{" "}
        con su texto completo. Desde aquí puedes <strong>Enviar ahora</strong> o{" "}
        <strong>Cancelar</strong> antes del envío. Las programadas se envían solas en la fecha
        elegida.
      </>
    ),
    img: "/recursos/guias/campana-lista.webp",
    alt: "Campaña en estado Borrador con botones Enviar ahora y Cancelar",
  },
  {
    title: "Ten en cuenta a quién llega",
    body: (
      <>
        La notificación solo llega a los clientes que <strong>activaron las notificaciones</strong>{" "}
        de tu negocio y mantienen su consentimiento vigente. Quien las desactive antes del envío
        no la recibe. Por eso conviene pedir el permiso al momento del registro — y no saturar:
        una campaña bien pensada a la semana rinde más que un mensaje diario.
      </>
    ),
  },
];

export default function CampanasPage() {
  return (
    <PageShell>
      <p className="text-xs font-semibold uppercase tracking-wide text-pl-green">
        Guías paso a paso
      </p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Cómo enviar una campaña push a tus clientes
      </h1>
      <p className="mt-2 text-sm text-ink-soft">⏱ 4 minutos · Nivel: principiante</p>

      <div className="mt-6 rounded-2xl border border-pl-green/20 bg-pl-cream/40 p-5">
        <h2 className="text-sm font-bold text-ink">Lo que necesitas</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
          {NEEDS.map((n) => (
            <li key={n} className="flex gap-2">
              <span className="text-pl-green">✓</span>
              {n}
            </li>
          ))}
        </ul>
      </div>

      <ol className="mt-10 space-y-10">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <h2 className="flex items-baseline gap-2.5 text-lg font-bold text-ink">
              <span className="flex h-7 w-7 shrink-0 translate-y-0.5 items-center justify-center rounded-full bg-pl-green text-sm font-extrabold text-white">
                {i + 1}
              </span>
              {s.title}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            {s.img ? (
              <Image
                src={s.img}
                alt={s.alt ?? ""}
                width={1280}
                height={800}
                className="mt-4 rounded-xl border border-neutral-200 shadow-sm"
              />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-ink">Qué sigue</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-soft">
          <li>
            <Link href="/guias/reportes" className="font-medium text-pl-green">
              Cómo interpretar tus reportes
            </Link>{" "}
            — mide si tus campañas traen clientes de vuelta
          </li>
          <li>
            <Link href="/guias" className="font-medium text-pl-green">
              Todas las guías
            </Link>
          </li>
        </ul>
        <Link
          href="/signup"
          className="mt-5 inline-block rounded-full bg-pl-action px-6 py-3 text-sm font-semibold text-white shadow-md shadow-pl-action/25 transition hover:bg-pl-green"
        >
          Crea tu cuenta gratis
        </Link>
      </div>
    </PageShell>
  );
}
