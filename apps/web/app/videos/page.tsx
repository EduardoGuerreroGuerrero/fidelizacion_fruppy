import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../_landing/shell";

export const metadata: Metadata = {
  title: "Videos tutoriales | PineappleLoyalty",
  description:
    "Mira en menos de un minuto cómo tus clientes se registran con el QR y cómo se configura un programa de fidelización.",
};

const VIDEOS_BASE =
  "https://itqnpobhrojviftqtwgv.supabase.co/storage/v1/object/public/recursos/videos";

const VIDEOS: {
  slug: string;
  title: string;
  desc: string;
  secs: number;
}[] = [
  {
    slug: "registro-qr",
    title: "Cómo se registran tus clientes con el QR",
    desc: "El cliente escanea el código, llena un formulario corto y recibe su tarjeta digital al instante — sin instalar nada.",
    secs: 27,
  },
  {
    slug: "programa",
    title: "Crea tu programa de fidelización en minutos",
    desc: "Elige sellos o puntos, define la recompensa y obtén tu código QR. Así de simple, sin conocimientos técnicos.",
    secs: 46,
  },
];

export default function VideosPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Videos tutoriales
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Mira cómo funciona PineappleLoyalty en menos de un minuto por video.
      </p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {VIDEOS.map((v) => (
          <li
            key={v.slug}
            className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm"
          >
            <div className="relative aspect-[16/9] bg-ink/5">
              <video
                controls
                playsInline
                preload="none"
                poster={`${VIDEOS_BASE}/poster-${v.slug}.webp`}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source src={`${VIDEOS_BASE}/${v.slug}.mp4`} type="video/mp4" />
              </video>
              <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-pl-green px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
                VIDEO
              </span>
              <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink/70 px-2 py-1 text-[11px] font-semibold text-white">
                {v.secs} s
              </span>
            </div>
            <div className="p-5">
              <h2 className="font-bold text-ink">{v.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{v.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-ink-soft">
        ¿Prefieres leer?{" "}
        <Link href="/guias" className="font-medium text-pl-green">
          Mira las guías paso a paso
        </Link>{" "}
        o las{" "}
        <Link href="/preguntas" className="font-medium text-pl-green">
          preguntas frecuentes
        </Link>
        .
      </p>
    </PageShell>
  );
}
