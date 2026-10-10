import Link from "next/link";
import QRCode from "qrcode";
import { getCardAppData } from "../_components/data";
import { Section, TitleBar } from "../_components/chrome";
import { VisitRow } from "../_components/cards";
import {
  IconChevron,
  IconInfo,
  IconQr,
  IconScan,
  IconStore,
  StampStrawberry,
} from "../_components/icons";

export const instant = false;

// La tarjeta del cliente con su QR grande para mostrar en caja.
export default async function Escanear({
  params,
}: PageProps<"/t/[token]/escanear">) {
  const { token } = await params;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/t/${token}`, {
    width: 220,
    margin: 1,
  });

  if (!card) {
    return (
      <p className="m-8 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
        Tarjeta no encontrada.
      </p>
    );
  }

  const isStamps = card.program_type === "stamps" && card.stamp_goal;
  const current = isStamps ? card.current_stamps : card.current_points;

  return (
    <>
      <TitleBar title="Escanear" href={base} />

      {/* Tarjeta con el QR */}
      <div className="relative mx-5 mt-2 overflow-hidden rounded-[28px] bg-brand shadow-lg shadow-brand/25">
        <span className="absolute -left-16 -top-20 size-56 rounded-full bg-white/10" />
        <span className="absolute -right-10 -bottom-24 size-64 rounded-full bg-white/10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/scan-photo.jpg"
          alt=""
          className="absolute inset-y-0 right-0 h-full w-[30%] object-cover opacity-90"
        />
        <span className="absolute inset-y-0 right-0 w-[30%] bg-gradient-to-r from-brand via-brand/60 to-transparent" />

        <div className="relative z-10 p-5 text-white">
          <div className="flex items-start justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-circle.jpg"
              alt="Fruppy Helados"
              className="size-14 rounded-full shadow-md"
            />
            <span className="text-right">
              <p className="font-semibold">{card.first_name}</p>
              <span className="mt-1 inline-block rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-brand-dark">
                Cliente activo
              </span>
            </span>
          </div>

          <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-4 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR de tu tarjeta" className="size-44" />
          </div>
          <p className="mx-auto mt-3 max-w-[240px] text-center text-[13px] font-medium leading-snug">
            Muestra este código en el punto de venta para registrar tu visita
          </p>

          <p className="mt-4 text-3xl font-bold tabular-nums">
            {current}
            {isStamps ? <span className="text-white/80"> / {card.stamp_goal}</span> : null}
          </p>
          <p className="text-sm text-white/85">
            {isStamps ? "sellos" : "puntos"}
          </p>
        </div>
      </div>

      {/* Ingresar código manualmente */}
      <Link
        href={`${base}/escanear/codigo`}
        className="mx-5 mt-5 flex items-center gap-3 rounded-2xl bg-neutral-50 p-4"
      >
        <IconScan className="size-6 text-brand" />
        <span className="flex-1 font-medium text-ink">
          Ingresar código manualmente
        </span>
        <IconChevron className="size-5 text-ink-soft" />
      </Link>

      {/* ¿Cómo funciona? */}
      <div className="mx-5 mt-5 rounded-[26px] bg-pastel-mint p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand">
            <IconInfo className="size-5 text-white" />
          </span>
          <p className="font-semibold text-ink">¿Cómo funciona?</p>
        </div>
        <div className="mt-4 flex justify-between gap-2 text-center">
          {[
            { n: "1", Icon: IconQr, text: "Muestra tu código QR" },
            { n: "2", Icon: IconStore, text: "El equipo lo escanea" },
            { n: "3", Icon: null, text: "Gana sellos automáticamente" },
          ].map(({ n, Icon, text }) => (
            <div key={n} className="flex w-1/3 flex-col items-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {n}
                </span>
              </span>
              <span className="mt-2 flex size-9 items-center justify-center rounded-full bg-white/80">
                {Icon ? (
                  <Icon className="size-5 text-brand" />
                ) : (
                  <StampStrawberry filled className="size-6" />
                )}
              </span>
              <p className="mt-1.5 text-[11px] font-medium leading-tight text-ink">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas visitas */}
      <Section title="Últimas visitas" actionHref={`${base}/bonos?tab=historial`} />
      {card.visits.length > 0 ? (
        <ul>
          {card.visits.map((v, i) => (
            <VisitRow key={i} visit={v} />
          ))}
        </ul>
      ) : (
        <p className="mx-5 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
          Aún no tienes visitas registradas.
        </p>
      )}
    </>
  );
}
