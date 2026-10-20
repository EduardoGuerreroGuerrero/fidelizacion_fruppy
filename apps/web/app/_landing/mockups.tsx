// Mockups CSS puros para la landing — sin imágenes externas.
import Image from "next/image";
import {
  IconCheckCircle,
  IconUsers,
  IconAward,
  IconBell,
  IconPin,
  IconGWallet,
} from "./icons";

const QR_SIZE = 21;

/** QR decorativo determinista (patrón fijo, no escaneable). */
export function FakeQr({ className = "" }: { className?: string }) {
  const cells: boolean[] = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      const finder =
        (r < 7 && c < 7) || (r < 7 && c >= QR_SIZE - 7) || (r >= QR_SIZE - 7 && c < 7);
      if (finder) {
        const rr = r >= QR_SIZE - 7 ? r - (QR_SIZE - 7) : r;
        const cc = c >= QR_SIZE - 7 ? c - (QR_SIZE - 7) : c;
        cells.push(
          rr === 0 || rr === 6 || cc === 0 || cc === 6 ||
            (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4),
        );
      } else {
        cells.push(((r * 31 + c * 17 + r * c * 7) % 5) < 2);
      }
    }
  }
  return (
    <div
      aria-hidden
      className={`grid aspect-square w-full ${className}`}
      style={{ gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)` }}
    >
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-neutral-800" : ""} />
      ))}
    </div>
  );
}

/** Helado soft-serve decorativo (cono + crema rosa). */
function IceCream({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" fill="none" aria-hidden className={className}>
      <path d="M24 56 14 26h20Z" fill="#e8b06a" />
      <path d="M17 34h14M19 42h10M21 49h6" stroke="#c98a4b" strokeWidth="1" />
      <circle cx="24" cy="21" r="12" fill="#f9a8c9" />
      <circle cx="17" cy="24" r="7" fill="#fbcfe2" />
      <circle cx="31" cy="24" r="7" fill="#f472b6" />
      <circle cx="24" cy="11" r="5" fill="#fce7f3" />
    </svg>
  );
}

/** Mini logo PineappleLoyalty para las tarjetas del mockup. */
function MiniBrand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <Image
        src="/pineapple/isotipo-trans.png"
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 object-contain"
      />
      <span
        className={`text-[8px] font-bold ${light ? "text-white" : "text-pl-green"}`}
      >
        Pineapple<span className={light ? "text-pl-green-2" : "text-pl-action"}>Loyalty</span>
      </span>
    </div>
  );
}

/** Tarjeta de sellos verde reutilizable (Fruppy Helados). */
function StampCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-pl-green to-[#0b3d24] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold leading-tight text-white">{title}</p>
          <p className="text-[6.5px] text-white/75">{sub}</p>
        </div>
        <IceCream className="h-11 w-9 shrink-0" />
      </div>
      <p className="mt-1 text-[6px] uppercase tracking-wide text-white/70">
        Sellos
      </p>
      <p className="text-sm font-extrabold leading-none text-white">
        8<span className="text-white/70">/10</span>
      </p>
      <div className="mt-1.5 flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < 8 ? "bg-pl-yellow" : "bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Botón "Añadir a Google Wallet" negro. */
function WalletButton() {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2">
      <IconGWallet className="h-3 w-3" />
      <span className="text-[8px] font-medium text-white">
        Añadir a Google Wallet
      </span>
    </div>
  );
}

/** Teléfono del hero: tarjeta Wallet "Fruppy Helados" + QR + botón wallet. */
export function HeroPhone() {
  return (
    <div className="relative mx-auto w-52 sm:w-64">
      <div className="rounded-[2.5rem] border-[8px] border-neutral-900 bg-white shadow-2xl shadow-pl-green/25">
        <div className="relative overflow-hidden rounded-[2rem]">
          <div className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-neutral-900" />
          <div className="px-4 pb-3 pt-8">
            <MiniBrand />
          </div>
          <div className="px-3.5">
            <StampCard title="Fruppy Helados" sub="Tu tarjeta de fidelización" />
          </div>
          <div className="px-5 pb-2 pt-3">
            <div className="mx-auto w-24 rounded-lg border border-neutral-100 bg-white p-1.5">
              <FakeQr />
            </div>
          </div>
          <div className="px-3.5 pb-4 pt-1">
            <WalletButton />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta tipo "tent" detrás del teléfono: "Escanea y regístrate". */
export function ScanCard() {
  return (
    <div className="w-36 -rotate-3 rounded-2xl bg-white p-4 pb-5 shadow-xl shadow-pl-green/10 sm:w-52">
      <MiniBrand />
      <p className="mt-2 text-[11px] font-bold leading-snug text-ink">
        Escanea y regístrate
      </p>
      <p className="mt-0.5 text-[8px] leading-snug text-neutral-500">
        Únete a nuestro programa de fidelización
      </p>
      <div className="mt-2 rounded-md border border-neutral-100 p-1">
        <FakeQr />
      </div>
    </div>
  );
}

/** Confeti decorativo del hero. */
export function Confetti() {
  return (
    <>
      <svg
        aria-hidden
        className="absolute -left-2 top-10 h-8 w-8 text-pl-green-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M3 18c3-1 4-3 4-6M7 20c2-1 3-2 3-4M11 21c1.5-.8 2-1.8 2-3" />
      </svg>
      <svg
        aria-hidden
        className="absolute right-4 top-0 h-9 w-9 text-pl-yellow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M12 3v4M5.5 5.5l2.5 2.5M18.5 5.5 16 8M4 12h3" />
      </svg>
      <span
        aria-hidden
        className="absolute -left-4 bottom-20 h-3 w-3 rounded-full bg-pl-yellow"
      />
      <span
        aria-hidden
        className="absolute right-10 -top-2 h-2.5 w-2.5 rounded-full bg-pl-green-2"
      />
    </>
  );
}

/** Laptop con el panel admin "Programa de fidelización" (paso 1). */
export function AdminLaptop() {
  const menu = ["Inicio", "Clientes", "Programa", "Campañas", "Reportes", "Configuración"];
  const fields: [string, string][] = [
    ["Nombre del programa", "Fruppy Club"],
    ["Tipo de programa", "Sellos"],
    ["Beneficio", "Producto gratis al completar"],
    ["Cantidad de sellos", "10"],
  ];
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-xl border-4 border-neutral-800 bg-white shadow-xl">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-[70px] shrink-0 space-y-0.5 bg-pl-green px-1.5 py-2.5">
            <MiniBrand light />
            {menu.map((m) => (
              <div
                key={m}
                className={`mt-1 flex items-center gap-1 rounded px-1 py-1 ${
                  m === "Programa" ? "bg-white/20" : ""
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-sm bg-white/60" />
                <span
                  className={`text-[6px] ${m === "Programa" ? "font-semibold text-white" : "text-white/60"}`}
                >
                  {m}
                </span>
              </div>
            ))}
          </div>
          {/* Contenido */}
          <div className="grid flex-1 grid-cols-[1fr_64px] gap-2 p-2.5">
            <div>
              <p className="text-[8px] font-bold text-ink">
                Programa de fidelización
              </p>
              <div className="mt-1.5 space-y-1">
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[5.5px] text-neutral-400">{label}</p>
                    <div className="mt-px flex h-3.5 items-center rounded border border-neutral-200 bg-neutral-50 px-1">
                      <span className="text-[6px] text-ink">{value}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-1 pt-0.5">
                  <p className="text-[5.5px] text-neutral-400">
                    Imagen de la tarjeta
                  </p>
                  <Image
                    src="/pineapple/isotipo-trans.png"
                    alt=""
                    width={10}
                    height={10}
                    className="h-2.5 w-2.5 rounded object-contain"
                  />
                  <span className="rounded border border-neutral-200 px-1 text-[5.5px] text-neutral-500">
                    Cambiar imagen
                  </span>
                </div>
                <div className="flex items-end gap-1.5 pt-0.5">
                  <div>
                    <p className="text-[5.5px] text-neutral-400">Código QR</p>
                    <div className="mt-px w-9 rounded border border-neutral-200 bg-white p-0.5">
                      <FakeQr />
                    </div>
                  </div>
                  <span className="mb-0.5 rounded bg-neutral-100 px-1.5 py-0.5 text-[5.5px] font-medium text-ink">
                    Descargar QR
                  </span>
                </div>
              </div>
            </div>
            {/* Vista previa de tarjeta */}
            <div className="self-start">
              <p className="mb-1 text-[5.5px] text-neutral-400">Vista previa</p>
              <div className="rounded-lg bg-gradient-to-br from-pl-green to-[#0b3d24] p-1.5">
                <div className="flex justify-between">
                  <p className="text-[6px] font-bold text-white">Fruppy Club</p>
                  <IceCream className="h-4 w-3" />
                </div>
                <div className="mt-1.5 flex gap-px">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i < 8 ? "bg-pl-yellow" : "bg-white/25"}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[4.5px] text-white/75">
                  10 sellos = 1 producto gratis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Base del laptop */}
      <div className="mx-auto h-2 w-[104%] -translate-x-[2%] rounded-b-xl rounded-t-sm bg-neutral-300" />
    </div>
  );
}

/** Teléfono con formulario de registro (paso 2). */
export function FormPhone() {
  const fields = ["Nombre completo", "Correo electrónico", "Número de celular"];
  return (
    <div className="mx-auto w-44">
      <div className="rounded-[2rem] border-[6px] border-neutral-900 bg-white shadow-lg">
        <div className="rounded-[1.6rem] px-3 pb-4 pt-5">
          <div className="mx-auto mb-1 h-1 w-8 rounded bg-neutral-200" />
          <MiniBrand />
          <p className="mt-1.5 text-[9px] font-bold leading-tight text-ink">
            Únete a nuestro programa de beneficios
          </p>
          <div className="mt-2 space-y-1">
            {fields.map((label) => (
              <div key={label}>
                <p className="text-[6px] text-neutral-400">{label}</p>
                <div className="mt-px flex h-3.5 items-center rounded border border-neutral-200 bg-neutral-50 px-1">
                  <span className="h-1 w-1 rounded-full bg-neutral-300" />
                </div>
              </div>
            ))}
            <div className="flex items-start gap-1 pt-1">
              <span className="mt-px flex h-2.5 w-2.5 items-center justify-center rounded-sm bg-pl-green-2">
                <IconCheckCircle className="h-2 w-2 text-white" strokeWidth={3} />
              </span>
              <span className="text-[5px] leading-snug text-neutral-500">
                Acepto la política de tratamiento de datos y quiero recibir
                notificaciones de Fruppy Helados.
              </span>
            </div>
          </div>
          <div className="mt-2 rounded-md bg-pl-action py-1.5 text-center text-[8px] font-semibold text-white">
            Registrarme
          </div>
          <p className="mt-1.5 text-center text-[5px] text-neutral-400">
            Al registrarte recibirás tu tarjeta en Google Wallet.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Notificación push de ejemplo. */
function PushCard() {
  return (
    <div className="w-44 rounded-xl border border-neutral-100 bg-white p-2.5 shadow-lg">
      <div className="flex items-center gap-1.5">
        <Image
          src="/pineapple/isotipo-trans.png"
          alt=""
          width={12}
          height={12}
          className="h-3 w-3 object-contain"
        />
        <p className="text-[7px] font-bold text-ink">Fruppy Helados</p>
        <p className="ml-auto text-[6px] text-neutral-400">ahora</p>
      </div>
      <p className="mt-1 text-[7px] font-semibold text-ink">
        ¡Tienes una promoción especial!
      </p>
      <p className="text-[6.5px] text-neutral-500">
        Ven y disfruta tu beneficio.
      </p>
    </div>
  );
}

/** Paso 3: tarjeta Wallet + push + panel de resultados. */
export function StatsPanel() {
  const bars = [28, 38, 34, 52, 66, 88];
  const stats = [
    { n: "1.248", l: "Clientes", icon: IconUsers },
    { n: "320", l: "Visitas", icon: IconCheckCircle },
    { n: "87%", l: "Retención", icon: IconAward },
    { n: "+42%", l: "Ventas", icon: IconAward },
  ];
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div className="relative z-10 mx-auto w-40">
        <StampCard title="Fruppy Helados" sub="Fruppy Club" />
      </div>
      <div className="relative z-20 ml-auto -mt-2 w-fit sm:absolute sm:-right-1 sm:top-10">
        <PushCard />
      </div>
      <div className="relative z-10 -mt-3 rounded-2xl bg-white p-4 pt-6 shadow-lg shadow-pl-green/10">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-ink">
            Resultados de tu programa
          </p>
          <span className="flex items-center gap-0.5 rounded-md border border-neutral-200 px-1.5 py-0.5 text-[6.5px] text-neutral-500">
            Últimos 30 días
            <svg viewBox="0 0 24 24" className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {stats.map(({ icon: Icon, n, l }) => (
            <div
              key={l}
              className="rounded-md border border-neutral-100 bg-neutral-50/70 px-0.5 py-1.5 text-center"
            >
              <Icon className="mx-auto h-2.5 w-2.5 text-pl-green-2" />
              <p className="mt-0.5 text-[8px] font-bold leading-none text-ink">{n}</p>
              <p className="mt-0.5 text-[5px] text-neutral-400">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex h-14 items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
              <span
                className={`w-full rounded-t-sm ${i === bars.length - 1 ? "bg-pl-green-2" : "bg-pl-green-2/35"}`}
                style={{ height: `${h}%` }}
              />
              <span className="text-[4.5px] text-neutral-400">
                {["Ene", "Feb", "Mar", "Abr", "May", "Jun"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Mini-visuales para las tarjetas de Funciones ---------- */

export function VisQr() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/50 p-2">
      <div className="w-10 shrink-0 rounded border border-neutral-200 bg-white p-0.5">
        <FakeQr />
      </div>
      <div className="flex-1">
        <p className="text-[7px] font-bold text-ink">Escanea y regístrate</p>
        <p className="text-[6px] text-neutral-400">Sin descargar una app</p>
      </div>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-pl-green-2" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
    </div>
  );
}

export function VisWallet() {
  return (
    <div className="p-2">
      <div className="mx-auto w-24 rounded-md border border-neutral-800 bg-neutral-900 p-1">
        <div className="rounded-sm bg-gradient-to-br from-pl-green to-[#0b3d24] p-1.5">
          <p className="text-[5.5px] font-bold text-white">Fruppy Club</p>
          <div className="mt-1 flex gap-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className={`h-0.5 flex-1 rounded-full ${i < 6 ? "bg-pl-yellow" : "bg-white/25"}`} />
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-center gap-0.5 rounded-sm bg-white/10 py-0.5">
          <IconGWallet className="h-2 w-2" />
          <span className="text-[4.5px] text-white/80">Google Wallet</span>
        </div>
      </div>
    </div>
  );
}

export function VisSellos() {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {[
        { t: "Puntos", d: "Acumula puntos por cada compra." },
        { t: "Sellos", d: "Completa sellos y recibe recompensa." },
      ].map((x) => (
        <div key={x.t} className="rounded-lg border border-pl-cream bg-pl-cream/40 p-1.5">
          <p className="text-[7px] font-bold text-ink">{x.t}</p>
          <p className="text-[5.5px] leading-tight text-neutral-500">{x.d}</p>
        </div>
      ))}
    </div>
  );
}

export function VisNotif() {
  return (
    <div className="relative rounded-lg border border-sky-100 bg-sky-50/50 p-1.5">
      <div className="rounded-md border border-neutral-100 bg-white p-1.5 shadow-sm">
        <div className="flex items-center gap-1">
          <IconBell className="h-2.5 w-2.5 text-pl-green-2" />
          <p className="text-[6.5px] font-bold text-ink">PineappleLoyalty</p>
          <p className="ml-auto text-[5px] text-neutral-400">ahora</p>
        </div>
        <p className="mt-0.5 text-[6px] font-semibold text-ink">¡Promoción especial!</p>
        <p className="text-[5.5px] text-neutral-500">Ven y disfruta tu beneficio.</p>
      </div>
      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-pl-yellow" />
      <span className="absolute -left-0.5 bottom-1 h-1.5 w-1.5 rounded-full bg-pl-green-2" />
    </div>
  );
}

export function VisMap() {
  return (
    <div className="relative h-[74px] overflow-hidden rounded-lg border border-emerald-100 bg-[#e8f5e9]">
      {/* Calles */}
      <div className="absolute left-0 top-1/3 h-1 w-full bg-white" />
      <div className="absolute left-1/4 top-0 h-full w-1 bg-white" />
      <div className="absolute bottom-1/4 left-0 h-1 w-full bg-white/70" />
      {/* Pin del comercio */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <IconPin className="h-5 w-5 fill-pl-green-2 text-pl-green-2" />
      </div>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-1.5 py-0.5 text-[5.5px] font-medium text-ink shadow-sm">
        Comercios cercanos
      </span>
    </div>
  );
}

export function VisSedes() {
  const sedes = ["Sede Principal", "Sede Norte", "Sede Centro", "Sede Sur"];
  return (
    <div className="space-y-0.5 rounded-lg border border-rose-100 bg-rose-50/50 p-1.5">
      {sedes.map((s) => (
        <div key={s} className="flex items-center gap-1 rounded-md bg-white px-1.5 py-1 shadow-sm">
          <IconPin className="h-2 w-2 text-rose-400" />
          <span className="text-[6px] font-medium text-ink">{s}</span>
          <span className="ml-auto h-1 w-1 rounded-full bg-pl-green-2" />
        </div>
      ))}
    </div>
  );
}

export function VisCampana() {
  return (
    <div className="rounded-lg bg-pl-ivory p-2">
      <p className="text-[7px] font-bold text-ink">Nueva campaña</p>
      {[
        ["Tipo de campaña", "Promoción"],
        ["Segmento", "Clientes activos"],
      ].map(([l, v]) => (
        <div key={l} className="mt-1">
          <p className="text-[5px] text-neutral-400">{l}</p>
          <div className="flex h-3 items-center justify-between rounded border border-neutral-200 bg-white px-1">
            <span className="text-[5.5px] text-ink">{v}</span>
            <svg viewBox="0 0 24 24" className="h-1.5 w-1.5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
      ))}
      <div className="mt-1.5 rounded bg-pl-action py-1 text-center text-[5.5px] font-semibold text-white">
        Programar campaña
      </div>
    </div>
  );
}

export function VisReporte() {
  const bars = [30, 45, 60, 50, 75, 90];
  return (
    <div className="rounded-lg bg-pl-ivory p-2">
      <div className="flex items-center justify-between">
        <p className="text-[6.5px] font-bold text-ink">Visitas registradas</p>
        <p className="text-[5px] text-neutral-400">Últimos 6 meses</p>
      </div>
      <div className="mt-1 flex h-9 items-end gap-1">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-pl-green-2" : "bg-pl-green-2/40"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Composite para la página de signup ---------- */

/** Columna visual del signup: teléfono + tarjeta tent con QR. */
export function SignupVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <HeroPhone />
      <div className="absolute -bottom-10 -right-2 z-10 sm:-right-8">
        <ScanCard />
      </div>
    </div>
  );
}

/** Tarjeta de testimonio del signup (Fruppy Helados). */
export function TestimonialCard() {
  return (
    <div className="relative rounded-2xl bg-white p-5 shadow-xl shadow-pl-green/10">
      <span className="absolute -top-4 left-5 font-serif text-5xl leading-none text-pl-green-2">
        &ldquo;
      </span>
      <p className="pt-3 text-[13px] leading-relaxed text-ink">
        &ldquo;Pineapple Loyalty nos ha permitido fidelizar a nuestros clientes
        de una forma muy sencilla.&rdquo;
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-200 to-rose-300">
          <IceCream className="h-7 w-6" />
        </span>
        <div>
          <p className="text-xs font-bold text-ink">Fruppy Helados</p>
          <p className="text-[10px] text-ink-soft">
            Heladería · Barranquilla, Colombia
          </p>
        </div>
      </div>
    </div>
  );
}
