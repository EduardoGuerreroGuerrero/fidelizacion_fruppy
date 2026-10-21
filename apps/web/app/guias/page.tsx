import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../_landing/shell";
import { IconArrowRight } from "../_landing/icons";

export const metadata: Metadata = {
  title: "Guías paso a paso | PineappleLoyalty",
  description:
    "Aprende a configurar tu programa de fidelización en minutos: programa, recompensas y código QR para registrar clientes.",
};

const GUIDES: {
  slug?: string;
  title: string;
  desc: string;
  mins: number;
  thumb?: string;
}[] = [
  {
    slug: "/guias/configurar-programa",
    title: "Cómo configurar tu programa de fidelización",
    desc: "Crea tu programa de puntos o sellos, define la recompensa y obtén el código QR de registro para tus clientes.",
    mins: 5,
    thumb: "/recursos/guias/thumb-configurar-programa.webp",
  },
  {
    slug: "/guias/registro-qr",
    title: "Cómo se registran tus clientes con el QR",
    desc: "Dónde poner el código QR, cómo se ve el registro para el cliente y qué datos puedes pedir.",
    mins: 4,
    thumb: "/recursos/guias/thumb-registro-qr.webp",
  },
  {
    slug: "/guias/campanas",
    title: "Cómo enviar una campaña push a tus clientes",
    desc: "Escribe tu mensaje, prográmalo si quieres y avisa a los clientes que activaron las notificaciones.",
    mins: 4,
    thumb: "/recursos/guias/thumb-campanas.webp",
  },
  {
    slug: "/guias/reportes",
    title: "Cómo interpretar tus reportes",
    desc: "Clientes, visitas y canjes: qué significa cada métrica y qué hacer con ella.",
    mins: 5,
    thumb: "/recursos/guias/thumb-reportes.webp",
  },
];

export default function GuiasPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Guías paso a paso
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Aprende a configurar tu programa de fidelización en minutos, sin conocimientos técnicos.
      </p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {GUIDES.map((g) => {
          const badge = (
            <span className="absolute left-3 top-3 rounded-full bg-pl-green px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
              GUÍA
            </span>
          );
          const meta = (
            <span className="mt-3 block text-xs font-medium text-ink-soft">
              ⏱ {g.mins} min de lectura
            </span>
          );
          return (
            <li key={g.title}>
              {g.slug ? (
                <Link
                  href={g.slug}
                  className="group block overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="relative block aspect-[16/9] overflow-hidden bg-pl-cream/40">
                    <Image
                      src={g.thumb!}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 340px, 100vw"
                      className="object-cover object-top"
                    />
                    {badge}
                  </span>
                  <span className="block p-5">
                    <span className="font-bold text-ink group-hover:text-pl-green">{g.title}</span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">
                      {g.desc}
                    </span>
                    <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-pl-action">
                      Leer guía
                      <IconArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </Link>
              ) : (
                <div className="block h-full overflow-hidden rounded-2xl border border-dashed border-ink/15 bg-white/60">
                  <span className="relative block aspect-[16/9] bg-pl-cream/40">
                    {badge}
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-pl-green">
                      Próximamente
                    </span>
                  </span>
                  <span className="block p-5">
                    <span className="font-bold text-ink">{g.title}</span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">
                      {g.desc}
                    </span>
                    {meta}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-sm text-ink-soft">
        ¿Tienes una duda puntual?{" "}
        <Link href="/preguntas" className="font-medium text-pl-green">
          Revisa las preguntas frecuentes
        </Link>{" "}
        o{" "}
        <Link href="/contacto" className="font-medium text-pl-green">
          contáctanos
        </Link>
        .
      </p>
    </PageShell>
  );
}
