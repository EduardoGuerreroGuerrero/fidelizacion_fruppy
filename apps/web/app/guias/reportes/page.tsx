import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../../_landing/shell";

export const metadata: Metadata = {
  title: "Cómo interpretar tus reportes | PineappleLoyalty",
  description:
    "Guía paso a paso: qué significa cada métrica de Analítica — clientes activos, visitas, sellos, canjes y tasa de retorno — y qué hacer con ella.",
};

const NEEDS = [
  "Tu cuenta de PineappleLoyalty con el programa activo",
  "Al menos unos días de visitas registradas para ver tendencias",
];

const STEPS: {
  title: string;
  body: React.ReactNode;
  img?: string;
  alt?: string;
}[] = [
  {
    title: "Abre Analítica",
    body: (
      <>
        En el menú <strong>Marketing → Analítica</strong> tienes todas las cifras de tu programa en una
        sola pantalla. Todo se calcula en tu zona horaria (<em>America/Bogota</em>), así que los
        números cuadran con tu jornada real.
      </>
    ),
    img: "/recursos/guias/analytics.webp",
    alt: "Panel de Analítica con tarjetas de métricas y gráfico de visitas",
  },
  {
    title: "Lee las tarjetas principales",
    body: (
      <>
        <strong>Clientes activos</strong>: cuántas tarjetas vigentes tienes en total.{" "}
        <strong>Clientes nuevos</strong> y <strong>con actividad</strong>: cuántos entraron o se
        movieron en el período elegido. <strong>Visitas</strong>: escaneos registrados por tu
        equipo. <strong>Sellos</strong> y <strong>Puntos otorgados</strong>: lo que diste (con lo
        canjeado debajo). <strong>Canjes completados</strong>: recompensas ya entregadas.{" "}
        <strong>Tasa de retorno</strong>: el porcentaje de clientes que volvieron al menos dos
        veces — la métrica estrella de un programa de fidelización.
      </>
    ),
  },
  {
    title: "Cambia el período y la agrupación",
    body: (
      <>
        Sobre el gráfico puedes mirar <strong>7, 30, 90 días o 1 año</strong> y agrupar por{" "}
        <strong>día, semana o mes</strong>. Para la rutina diaria usa 7 o 30 días por día; para
        ver tendencias largas, 90 días o 1 año por semana o mes. Bajo el gráfico verás el total
        del período y el promedio por día.
      </>
    ),
  },
  {
    title: "Qué hacer con cada cifra",
    body: (
      <>
        Pocas <strong>visitas</strong> pero muchos clientes activos: tu programa existe pero los
        clientes no vuelven — prueba una{" "}
        <Link href="/guias/campanas" className="font-medium text-pl-green">
          campaña push
        </Link>
        . Muchos <strong>sellos otorgados</strong> y cero <strong>canjes</strong>: la meta puede
        estar muy alta o la recompensa poco atractiva. <strong>Tasa de retorno</strong> baja:
        revisa si el QR está visible y si tu equipo registra cada visita.{" "}
        <strong>Clientes nuevos</strong> en cero: mueve el QR a un lugar más visible o pide al
        equipo ofrecerlo al pagar.
      </>
    ),
  },
];

export default function ReportesPage() {
  return (
    <PageShell>
      <p className="text-xs font-semibold uppercase tracking-wide text-pl-green">
        Guías paso a paso
      </p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Cómo interpretar tus reportes
      </h1>
      <p className="mt-2 text-sm text-ink-soft">⏱ 5 minutos · Nivel: principiante</p>

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
            <Link href="/preguntas" className="font-medium text-pl-green">
              Preguntas frecuentes
            </Link>{" "}
            — respuestas cortas a dudas puntuales
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
