import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../_landing/shell";
import { IconDoc, IconBell, IconArrowRight } from "../_landing/icons";

export const metadata: Metadata = {
  title: "Plantillas y material descargable | PineappleLoyalty",
  description:
    "Descarga recursos listos para usar: mensajes para campañas push, checklist de lanzamiento y afiche QR imprimible para tu negocio.",
};

const FILES: {
  file: string;
  icon: "doc" | "bell" | "arrow";
  title: string;
  desc: string;
  meta: string;
}[] = [
  {
    file: "mensajes-campanas.pdf",
    icon: "bell",
    title: "Mensajes listos para campañas",
    desc: "12 textos cortos para notificaciones push: bienvenida, promociones, reactivación y fechas especiales. Solo reemplaza los datos de tu negocio.",
    meta: "PDF · 2 páginas",
  },
  {
    file: "checklist-lanzamiento.pdf",
    icon: "doc",
    title: "Checklist de lanzamiento",
    desc: "Los 8 pasos para tener tu programa funcionando: de crear la cuenta a enviar tu primera campaña. Imprímelo y márcalo a medida que avanzas.",
    meta: "PDF · 1 página",
  },
  {
    file: "afiche-qr.pdf",
    icon: "arrow",
    title: "Afiche QR imprimible",
    desc: "Cartel «¡Regístrate aquí!» para tu caja o vitrina. Descarga tu QR en el panel (Marketing → QR registro) y pégalo en el espacio marcado.",
    meta: "PDF · 1 página · para imprimir",
  },
];

const ICONS = { doc: IconDoc, bell: IconBell, arrow: IconArrowRight } as const;

export default function PlantillasPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Plantillas y material
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Recursos listos para descargar y usar en tu negocio — gratis, sin registro.
      </p>

      <ul className="mt-8 grid gap-5">
        {FILES.map((f) => {
          const Ic = ICONS[f.icon];
          return (
            <li key={f.file}>
              <a
                href={`/recursos/plantillas/${f.file}`}
                download
                className="group flex items-center gap-4 rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pl-cream text-pl-green">
                  <Ic className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-bold text-ink group-hover:text-pl-green">
                    {f.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                    {f.desc}
                  </span>
                  <span className="mt-1.5 block text-xs font-medium text-ink-soft/70">
                    {f.meta}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-pl-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-pl-green">
                  Descargar
                  <IconArrowRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-sm text-ink-soft">
        ¿Buscas instrucciones paso a paso?{" "}
        <Link href="/guias" className="font-medium text-pl-green">
          Mira las guías
        </Link>{" "}
        o los{" "}
        <Link href="/videos" className="font-medium text-pl-green">
          videos tutoriales
        </Link>
        .
      </p>
    </PageShell>
  );
}
