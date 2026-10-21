import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../../_landing/shell";

export const metadata: Metadata = {
  title: "Cómo configurar tu programa de fidelización | PineappleLoyalty",
  description:
    "Guía paso a paso: crea tu programa de sellos o puntos, define la recompensa y obtén el código QR para registrar clientes.",
};

const NEEDS = [
  "Tu cuenta de PineappleLoyalty (si aún no la tienes, créala gratis)",
  "El nombre de tu programa (ej. «Club Tu Negocio»)",
  "Una idea del premio: qué gana el cliente al acumular",
];

const STEPS: {
  title: string;
  body: React.ReactNode;
  img?: string;
  alt?: string;
}[] = [
  {
    title: "Entra a tu panel",
    body: (
      <>
        Inicia sesión en PineappleLoyalty y abre tu negocio desde{" "}
        <strong>Mis organizaciones</strong>. Verás el menú con Inicio, Registrar visita, Clientes,
        Programa, Marketing y Administración.
      </>
    ),
    img: "/recursos/guias/paso-inicio.webp",
    alt: "Panel principal de PineappleLoyalty para el negocio de ejemplo",
  },
  {
    title: "Crea tu programa",
    body: (
      <>
        En la pestaña <strong>Programa</strong>, llena el formulario <strong>Nuevo programa</strong>
        : escribe el nombre, elige el tipo <strong>Sellos</strong> o <strong>Puntos</strong> y
        define la meta. Para sellos, la meta es cuántas visitas necesita el cliente (ej. 10 sellos).
        Para puntos, define cuántos puntos gana por cada unidad de moneda que compre. Pulsa{" "}
        <strong>Crear programa</strong>.
      </>
    ),
    img: "/recursos/guias/paso-programa.webp",
    alt: "Formulario de nuevo programa con nombre, tipo y meta de sellos",
  },
  {
    title: "Revisa que quedó activo",
    body: (
      <>
        El programa aparece en la lista con su tipo y meta. Desde aquí puedes{" "}
        <strong>Guardar</strong> cambios al nombre o a la meta, y <strong>Archivar</strong> un
        programa que ya no uses.
      </>
    ),
    img: "/recursos/guias/paso-programa-listo.webp",
    alt: "Lista de programas con el programa creado y su meta de sellos",
  },
  {
    title: "Define la recompensa",
    body: (
      <>
        Ve a <strong>Programa → Recompensas</strong> y pulsa <strong>Nueva recompensa</strong>: escribe
        qué gana el cliente (ej. «Producto gratis»), elige el programa y pon el costo en sellos o
        puntos — normalmente igual a la meta del programa. Guarda con{" "}
        <strong>Crear recompensa</strong>.
      </>
    ),
    img: "/recursos/guias/paso-recompensa.webp",
    alt: "Formulario de nueva recompensa y lista con la recompensa creada",
  },
  {
    title: "Obtén tu código QR",
    body: (
      <>
        En <strong>Marketing → QR registro</strong> tienes el código de tu negocio. Imprímelo y ponlo
        donde tus clientes lo vean: caja, vitrina o mesas. Al escanearlo, cada cliente se registra
        solo y recibe su tarjeta digital por correo. Si el QR se filtra, puedes{" "}
        <strong>rotarlo</strong> desde la misma página — los clientes ya registrados conservan su
        tarjeta.
      </>
    ),
    img: "/recursos/guias/paso-qr.webp",
    alt: "Página del código QR de registro de clientes",
  },
];

export default function ConfigurarProgramaPage() {
  return (
    <PageShell>
      <p className="text-xs font-semibold uppercase tracking-wide text-pl-green">
        Guías paso a paso
      </p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Cómo configurar tu programa de fidelización
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
            <Link href="/guias/registro-qr" className="font-medium text-pl-green">
              Cómo se registran tus clientes con el QR
            </Link>{" "}
            — el flujo completo, del código impreso a la visita registrada
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
