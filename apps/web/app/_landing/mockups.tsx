// Mockups CSS puros para la landing — sin imágenes externas.
import Image from "next/image";
import { IconCheckCircle, IconUsers, IconAward } from "./icons";

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
        <span key={i} className={on ? "bg-neutral-900" : ""} />
      ))}
    </div>
  );
}

/** Teléfono del hero: tarjeta Wallet "Helados Artesanales". */
export function HeroPhone() {
  return (
    <div className="relative mx-auto w-64 sm:w-72">
      <div className="rounded-[2.75rem] border-[10px] border-neutral-900 bg-white shadow-2xl shadow-pl-green/20">
        <div className="relative overflow-hidden rounded-[2.1rem]">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900" />
          {/* Cabecera de la tarjeta */}
          <div className="bg-gradient-to-br from-pl-green to-[#0b3d24] px-4 pb-5 pt-9">
            <div className="flex items-center gap-1.5">
              <Image
                src="/pineapple/isotipo.png"
                alt=""
                width={18}
                height={18}
                className="h-4 w-4 object-contain"
              />
              <span className="text-[9px] font-semibold text-white/90">
                Pineapple<span className="text-pl-green-2">Loyalty</span>
              </span>
            </div>
            <div className="mt-3 rounded-xl bg-white/95 p-3">
              <p className="text-[11px] font-bold leading-tight text-pl-green">
                Helados Artesanales
              </p>
              <p className="text-[7px] text-neutral-500">Programa de puntos y sellos</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-[7px] uppercase tracking-wide text-neutral-400">
                    Puntos
                  </p>
                  <p className="text-base font-extrabold leading-none text-pl-green">
                    8<span className="text-neutral-400">/10</span>
                  </p>
                </div>
                {/* Helado decorativo */}
                <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gradient-to-br from-pl-cream to-amber-200">
                  <div className="absolute left-1/2 top-2 h-7 w-7 -translate-x-1/2 rounded-full bg-gradient-to-br from-pink-300 to-rose-400" />
                  <div className="absolute left-1/2 top-8 h-6 w-3 -translate-x-1/2 rounded-b-full bg-amber-500" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < 8 ? "bg-pl-yellow" : "bg-neutral-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* QR */}
          <div className="bg-white px-5 py-4">
            <div className="mx-auto w-28 rounded-lg border border-neutral-100 bg-white p-1.5">
              <FakeQr />
            </div>
          </div>
          {/* Botón wallet */}
          <div className="px-4 pb-5">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5">
              <span className="inline-block h-3 w-4 rounded-sm border border-white/80" />
              <span className="text-[9px] font-medium text-white">
                Añadir a Google Wallet
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta blanca detrás del teléfono: "Escanea y regístrate". */
export function ScanCard() {
  return (
    <div className="w-44 -rotate-6 rounded-2xl bg-white p-4 shadow-xl shadow-pl-green/10 sm:w-52">
      <p className="text-[11px] font-bold leading-snug text-ink">
        Escanea y regístrate
      </p>
      <p className="mt-0.5 text-[8px] leading-snug text-neutral-500">
        Únete a nuestro programa de beneficios
      </p>
      <div className="mt-2 rounded-md border border-neutral-100 p-1">
        <FakeQr />
      </div>
      <div className="mt-2 flex items-center justify-center gap-1">
        <Image
          src="/pineapple/isotipo.png"
          alt=""
          width={12}
          height={12}
          className="h-3 w-3 object-contain"
        />
        <span className="text-[8px] font-semibold text-pl-green">
          Pineapple<span className="text-pl-green-2">Loyalty</span>
        </span>
      </div>
    </div>
  );
}

/** Tarjeta flotante "¡Registro exitoso!". */
export function SuccessCard() {
  return (
    <div className="w-44 rotate-2 rounded-2xl bg-white p-4 shadow-xl shadow-pl-green/10 sm:w-48">
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-pl-green-2 text-white">
        <IconCheckCircle className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <p className="mt-2 text-center text-[11px] font-bold text-ink">
        ¡Registro exitoso!
      </p>
      <p className="mt-1 text-center text-[8px] leading-snug text-neutral-500">
        Tu tarjeta ya está lista para usar en Google Wallet.
      </p>
    </div>
  );
}

/** Confeti decorativo del hero. */
export function Confetti() {
  return (
    <>
      <svg
        aria-hidden
        className="absolute -left-4 top-8 h-8 w-8 text-pl-green-2"
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
        className="absolute -right-2 top-2 h-9 w-9 text-pl-yellow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M12 3v4M5.5 5.5l2.5 2.5M18.5 5.5 16 8M4 12h3" />
      </svg>
      <svg
        aria-hidden
        className="absolute -bottom-6 right-16 h-7 w-7 rotate-12 text-pl-green-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M4 20c2-6 6-10 12-12" />
      </svg>
      <span
        aria-hidden
        className="absolute -left-8 bottom-16 h-3 w-3 rounded-full bg-pl-yellow"
      />
      <span
        aria-hidden
        className="absolute right-6 -top-4 h-2.5 w-2.5 rounded-full bg-pl-green-2"
      />
    </>
  );
}

/** Laptop con el panel "Programa de fidelización" (paso 1). */
export function LaptopMockup() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-t-xl border-4 border-neutral-800 bg-white shadow-lg">
        <div className="flex overflow-hidden rounded-t-md">
          {/* Sidebar */}
          <div className="w-16 shrink-0 space-y-2 bg-pl-green px-2 py-3">
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-pl-yellow" />
              <span className="h-1 w-8 rounded bg-white/40" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-white/50" />
                <span
                  className="h-1 rounded bg-white/30"
                  style={{ width: i % 2 ? 18 : 26 }}
                />
              </div>
            ))}
          </div>
          {/* Contenido */}
          <div className="flex-1 p-3">
            <p className="text-[9px] font-bold text-ink">Programa de fidelización</p>
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <div className="space-y-1.5">
                {["Nombre de tarjeta", "Tipo", "Puntos"].map((label) => (
                  <div key={label}>
                    <p className="text-[6px] text-neutral-400">{label}</p>
                    <div className="mt-0.5 h-3.5 rounded border border-neutral-200 bg-neutral-50" />
                  </div>
                ))}
              </div>
              {/* Vista previa de tarjeta */}
              <div className="flex w-20 items-center justify-center rounded-md bg-pl-cream">
                <Image
                  src="/pineapple/isotipo.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <span className="h-3.5 w-9 rounded bg-neutral-200" />
              <span className="h-3.5 w-9 rounded bg-pl-green-2" />
            </div>
          </div>
        </div>
      </div>
      {/* Base del laptop */}
      <div className="mx-auto h-2.5 w-[104%] -translate-x-[2%] rounded-b-xl rounded-t-sm bg-neutral-300" />
    </div>
  );
}

/** Teléfono con formulario de registro (paso 2). */
export function FormPhone() {
  return (
    <div className="mx-auto w-44">
      <div className="rounded-[2rem] border-[6px] border-neutral-900 bg-white shadow-lg">
        <div className="rounded-[1.6rem] px-3 pb-4 pt-6">
          <div className="mx-auto mb-1 h-1 w-8 rounded bg-neutral-200" />
          <Image
            src="/pineapple/isotipo.png"
            alt=""
            width={28}
            height={28}
            className="mx-auto h-7 w-7 object-contain"
          />
          <p className="mt-1.5 text-center text-[9px] font-bold leading-tight text-ink">
            Únete a nuestro programa de beneficios
          </p>
          <div className="mt-2.5 space-y-1.5">
            {["Nombre completo", "Correo electrónico", "Número de celular"].map(
              (label) => (
                <div key={label}>
                  <p className="text-[6px] text-neutral-400">{label}</p>
                  <div className="mt-0.5 h-3.5 rounded border border-neutral-200 bg-neutral-50" />
                </div>
              ),
            )}
            <div className="flex items-center gap-1 pt-0.5">
              <span className="h-2 w-2 rounded-sm border border-neutral-300" />
              <span className="text-[6px] text-neutral-400">
                Acepto las políticas de datos
              </span>
            </div>
          </div>
          <div className="mt-2.5 rounded-md bg-pl-green py-1.5 text-center text-[8px] font-semibold text-white">
            Registrarme
          </div>
        </div>
      </div>
    </div>
  );
}

/** Panel de estadísticas (paso 3). */
export function StatsPanel() {
  const bars = [28, 34, 42, 38, 52, 60, 74, 88];
  return (
    <div className="mx-auto w-full max-w-xs rounded-2xl bg-white p-5 shadow-lg shadow-pl-green/10">
      <p className="text-xs font-semibold text-ink">Clientes frecuentes</p>
      <p className="mt-1 text-3xl font-extrabold text-pl-green-2">+42%</p>
      <p className="text-[10px] text-neutral-400">en los últimos 3 meses</p>
      <div className="mt-3 flex h-16 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t-sm ${
              i === bars.length - 1 ? "bg-pl-green-2" : "bg-pl-green-2/40"
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { icon: IconUsers, n: "1.248", l: "Clientes" },
          { icon: IconCheckCircle, n: "320", l: "Visitas" },
          { icon: IconAward, n: "87%", l: "Retención" },
        ].map(({ icon: Icon, n, l }) => (
          <div
            key={l}
            className="rounded-lg border border-neutral-100 bg-neutral-50/60 px-1 py-2 text-center"
          >
            <Icon className="mx-auto h-3.5 w-3.5 text-pl-green-2" />
            <p className="mt-0.5 text-[11px] font-bold leading-none text-ink">
              {n}
            </p>
            <p className="mt-0.5 text-[7px] text-neutral-400">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
