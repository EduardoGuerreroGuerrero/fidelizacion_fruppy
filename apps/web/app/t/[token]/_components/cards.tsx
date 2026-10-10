import Link from "next/link";
import type { CardLocation, CardReward, CardVisit } from "./data";
import { formatDateTime } from "./data";
import {
  IconChevron,
  IconCone,
  IconGift,
  IconPercent,
  IconQr,
  IconStore,
} from "./icons";
import { StampMini } from "./stamps";

// ---------- tarjeta "Siguiente recompensa" (menta) ---------------------------

export function NextRewardCard({
  reward,
  current,
  href,
}: {
  reward: CardReward;
  current: number;
  href: string;
}) {
  const goal = reward.cost_stamps ?? reward.cost_points ?? 0;
  const unit = reward.cost_stamps != null ? "sello" : "punto";
  const missing = Math.max(goal - current, 0);
  return (
    <Link
      href={href}
      className="mx-5 flex items-center gap-4 rounded-3xl bg-pastel-mint p-4"
    >
      <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-pastel-pink">
        <IconCone className="size-8 text-accent" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-ink">{reward.name}</span>
        <span className="mt-0.5 block text-sm leading-snug text-ink-soft">
          {missing > 0
            ? `Completa ${missing} ${unit}${missing === 1 ? "" : "s"} más para canjearla`
            : "¡Ya puedes canjearla!"}
        </span>
      </span>
      <IconChevron className="size-5 shrink-0 text-ink-soft" />
    </Link>
  );
}

// ---------- tarjeta de bono (pastel, cicla 5 estilos del mockup) --------------

const BONO_STYLES = [
  { bg: "bg-pastel-pink", btn: "bg-accent" },
  { bg: "bg-pastel-mint", btn: "bg-brand" },
  { bg: "bg-pastel-cream", btn: "bg-[#f0a040]" },
  { bg: "bg-pastel-lav", btn: "bg-[#9b6ddf]" },
  { bg: "bg-pastel-sky", btn: "bg-[#4a9fd8]" },
] as const;

export function RewardCard({
  reward,
  current,
  index,
  base,
}: {
  reward: CardReward;
  current: number;
  index: number;
  base: string;
}) {
  const style = BONO_STYLES[index % BONO_STYLES.length];
  const n = (index % 5) + 1;
  const goal = reward.cost_stamps ?? reward.cost_points ?? 0;
  const isStamps = reward.cost_stamps != null;
  const missing = Math.max(goal - current, 0);
  const unit = isStamps ? "sello" : "punto";

  return (
    <div
      className={`relative mx-5 mb-4 overflow-hidden rounded-[26px] ${style.bg} p-4 pl-3`}
    >
      {/* foto que sangra por la esquina superior derecha */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/brand/bono-photo-${n}.jpg`}
        alt=""
        className="absolute -top-5 right-0 h-24 w-28 object-cover"
      />
      <div className="relative flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/brand/bono-icon-${n}.jpg`}
          alt=""
          className="size-20 shrink-0 rounded-full object-cover shadow-sm"
        />
        <div className="min-w-0 flex-1 pr-16">
          <p className="font-semibold leading-tight text-ink">{reward.name}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            {missing > 0
              ? `Completa ${missing} ${unit}${missing === 1 ? "" : "s"} más para canjearla`
              : "¡Disponible para canjear!"}
          </p>
        </div>
      </div>
      <div className="relative mt-3 flex items-end justify-between">
        {isStamps ? (
          <StampMini current={current} goal={goal} />
        ) : (
          <span className="text-xs font-semibold text-ink">
            {Math.min(current, goal)} / {goal} puntos
          </span>
        )}
        <Link
          href={`${base}/bonos/${reward.id}`}
          className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-semibold text-white shadow-sm ${style.btn}`}
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
}

// ---------- fila de canje (Historial) ----------------------------------------

export function RedemptionRow({
  reward,
  redeemedAt,
  location,
}: {
  reward: string;
  redeemedAt: string;
  location: string | null;
}) {
  return (
    <li className="mx-5 mb-3 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-pastel-lav">
        <IconGift className="size-6 text-[#9b6ddf]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">{reward}</span>
        <span className="block text-xs text-ink-soft">
          {formatDateTime(redeemedAt)}
          {location ? ` · ${location}` : ""}
        </span>
      </span>
      <span className="rounded-full bg-pastel-mint px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
        Canjeado
      </span>
    </li>
  );
}

// ---------- fila de visita ----------------------------------------------------

export function VisitRow({ visit }: { visit: CardVisit }) {
  return (
    <li className="mx-5 mb-3 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-pastel-sky">
        <IconStore className="size-6 text-[#4a9fd8]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">
          {visit.location ?? "Sede"}
        </span>
        <span className="block text-xs text-ink-soft">
          {formatDateTime(visit.visited_at)}
        </span>
      </span>
      {visit.stamps > 0 ? (
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
          +{visit.stamps} sello{visit.stamps === 1 ? "" : "s"}
        </span>
      ) : null}
    </li>
  );
}

// ---------- accesos rápidos del Inicio ----------------------------------------

export function QuickActions({ base }: { base: string }) {
  const items = [
    { href: `${base}/bonos`, label: "Mis bonos", bg: "bg-[#fde3c8]", Icon: IconGift, fg: "text-[#e8862e]" },
    { href: `${base}/escanear`, label: "Escanear", bg: "bg-brand-soft", Icon: IconQr, fg: "text-brand" },
    { href: `${base}/promociones`, label: "Promociones", bg: "bg-pastel-lav", Icon: IconPercent, fg: "text-[#9b6ddf]" },
    { href: `${base}/sedes`, label: "Nuestras sedes", bg: "bg-pastel-pink", Icon: IconStore, fg: "text-accent" },
  ];
  return (
    <div className="mt-6 flex justify-between px-7">
      {items.map(({ href, label, bg, Icon, fg }) => (
        <Link key={label} href={href} className="flex w-16 flex-col items-center gap-1.5">
          <span className={`flex size-14 items-center justify-center rounded-full ${bg}`}>
            <Icon className={`size-6 ${fg}`} />
          </span>
          <span className="text-center text-[11px] font-medium leading-tight text-ink">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ---------- fila de menú de perfil --------------------------------------------

export function MenuRow({
  href,
  Icon,
  tint,
  title,
  subtitle,
}: {
  href: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  tint: string;
  title: string;
  subtitle: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3.5 px-5 py-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tint}`}
        >
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">{title}</span>
          <span className="block text-xs text-ink-soft">{subtitle}</span>
        </span>
        <IconChevron className="size-5 text-ink-soft" />
      </Link>
    </li>
  );
}

// ---------- fila de sede ------------------------------------------------------

export function LocationRow({
  location,
  index,
}: {
  location: CardLocation;
  index: number;
}) {
  const photo = `/brand/loc-${(index % 3) + 1}.jpg`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${location.name} ${location.address ?? ""}`,
  )}`;
  return (
    <li className="mx-5 mb-4 flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={location.name}
        className="size-24 shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-semibold leading-tight text-ink">{location.name}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">
          {location.address}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-[#dcf5ec] px-2 py-0.5 font-semibold text-[#1d9e6c]">
            Abierto
          </span>
          <span className="text-ink-soft">Lun-Dom: 12:00 - 21:00</span>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs font-semibold text-brand"
        >
          Cómo llegar
        </a>
      </div>
    </li>
  );
}
