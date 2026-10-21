import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../../_landing/shell";

export const metadata: Metadata = {
  title: "Cómo se registran tus clientes con el QR | PineappleLoyalty",
  description:
    "Guía paso a paso: imprime tu código QR, así se registra el cliente, recibe su tarjeta digital y tú ves su visita en el panel.",
};

const NEEDS = [
  "Tu programa ya configurado (ver la guía anterior)",
  "El código QR impreso o visible en tu punto de venta",
  "Un cliente con celular para probar el flujo",
];

const STEPS: {
  title: string;
  body: React.ReactNode;
  img?: string;
  alt?: string;
}[] = [
  {
    title: "Pon el QR donde el cliente lo vea",
    body: (
      <>
        En <strong>Marketing → QR registro</strong> está el código único de tu negocio. Imprímelo y
        pégalo en la caja, la vitrina o las mesas. El cliente lo escanea con la cámara de su
        celular — no necesita instalar nada. Si el código se filtra o aparecen registros raros,
        usa <strong>Rotar QR</strong>: el anterior deja de funcionar y tus clientes ya registrados
        conservan su tarjeta.
      </>
    ),
    img: "/recursos/guias/qr-page.webp",
    alt: "Página QR registro con el código del negocio y su enlace",
  },
  {
    title: "El cliente llena un formulario corto",
    body: (
      <>
        Al escanear, el cliente abre una página con el nombre de tu negocio y tu programa. Solo
        pide <strong>nombre</strong> y <strong>correo electrónico</strong> (obligatorios) y{" "}
        <strong>celular</strong> (opcional). Debe aceptar el tratamiento de datos personales;
        aceptar mensajes promocionales es opcional y puedes usarlo después para tus campañas.
      </>
    ),
    img: "/recursos/guias/registro-form.webp",
    alt: "Formulario de registro del cliente con nombre, correo y autorizaciones",
  },
  {
    title: "Recibe su tarjeta digital al instante",
    body: (
      <>
        Al pulsar <strong>Crear mi tarjeta</strong>, el cliente ve su tarjeta con tu logo, su
        nombre y el contador de sellos. También le llega un correo con el enlace para abrirla
        cuando quiera — y puede guardarla en <strong>Google Wallet</strong> para tenerla siempre
        a la mano.
      </>
    ),
    img: "/recursos/guias/tarjeta-cliente.webp",
    alt: "Tarjeta digital del cliente con logo del negocio y contador de sellos",
  },
  {
    title: "En cada visita, el cliente muestra su QR",
    body: (
      <>
        Dentro de su tarjeta, el cliente toca <strong>Mi QR</strong> y muestra el código en caja.
        Es personal e intransferible: cada escaneo queda registrado como una visita suya.
      </>
    ),
    img: "/recursos/guias/cliente-qr.webp",
    alt: "Pantalla Mi QR del cliente con su código personal",
  },
  {
    title: "Tu equipo registra la visita",
    body: (
      <>
        En el panel, abre <strong>Registrar visita</strong> y escanea el código del cliente con{" "}
        <strong>Escanear con cámara</strong> — o pega el token si lo recibes por otro medio.
        Indica cuántos <strong>sellos otorgar</strong> (normalmente 1) y confirma. Verás el
        mensaje de éxito con el nombre del cliente y su nuevo saldo.
      </>
    ),
    img: "/recursos/guias/scan-ok.webp",
    alt: "Página Registrar visita con confirmación de visita registrada",
  },
  {
    title: "El cliente aparece en tu lista",
    body: (
      <>
        Cada registro entra a <strong>Clientes</strong> con su nombre, contacto y permisos.
        Desde ahí puedes buscar, exportar a CSV o agregar clientes manualmente con{" "}
        <strong>Nuevo cliente</strong> si alguien se registra en mostrador.
      </>
    ),
    img: "/recursos/guias/clientes.webp",
    alt: "Lista de clientes del panel con una clienta registrada",
  },
];

export default function RegistroQrPage() {
  return (
    <PageShell>
      <p className="text-xs font-semibold uppercase tracking-wide text-pl-green">
        Guías paso a paso
      </p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Cómo se registran tus clientes con el QR
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
            <Link href="/guias/campanas" className="font-medium text-pl-green">
              Cómo enviar una campaña a tus clientes
            </Link>{" "}
            — avísales de tus promociones con notificaciones push
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
