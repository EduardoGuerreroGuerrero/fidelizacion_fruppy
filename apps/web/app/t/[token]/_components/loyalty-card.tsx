import Link from "next/link";
import { IconQr } from "./icons";

// La tarjeta de lealtad teal del mockup, simplificada: marca, nombre del
// cliente, badge y UN solo contador grande con su unidad. Sin foto de
// producto ni decoraciones pesadas — el saldo se entiende en segundos.
export function LoyaltyCard({
  firstName,
  current,
  goal,
  programType,
  cardHref,
  qrHref,
  qrLabel,
}: {
  firstName: string;
  current: number;
  goal: number | null;
  programType: "stamps" | "points";
  cardHref?: string;
  qrHref: string;
  qrLabel?: string;
}) {
  return (
    <div className="relative mx-5 overflow-hidden rounded-[28px] bg-brand shadow-md shadow-brand/20">
      {/* onda decorativa sutil */}
      <span className="absolute -left-16 -top-20 size-56 rounded-full bg-white/10" />

      {cardHref ? (
        <Link href={cardHref} aria-label="Ver mi tarjeta" className="absolute inset-0 z-10" />
      ) : null}

      <div className="relative z-10 p-5 pb-6 text-white">
        <div className="flex items-start justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Fruppy Helados"
            className="h-16 w-auto object-contain drop-shadow-md"
          />
          <Link
            href={qrHref}
            className="relative z-20 flex w-[84px] flex-col items-center gap-1 rounded-2xl bg-white px-2.5 py-2.5 text-brand shadow-md"
          >
            <IconQr className="size-7" />
            <span className="text-center text-[10px] font-semibold leading-tight">
              {qrLabel ?? "Mi QR"}
            </span>
          </Link>
        </div>
        <p className="mt-5 text-lg font-semibold">{firstName}</p>
        <span className="mt-1 inline-block rounded-full bg-white/90 px-3 py-0.5 text-[11px] font-semibold text-brand-dark">
          Cliente activo
        </span>
        <p className="mt-5 text-4xl font-bold tabular-nums">
          {current}
          {goal ? <span className="text-white/80"> / {goal}</span> : null}
        </p>
        <p className="text-sm text-white/85">
          {programType === "stamps" ? "sellos" : "puntos"}
        </p>
      </div>
    </div>
  );
}
