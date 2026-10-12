import Link from "next/link";
import {
  IconCalendar,
  IconChevron,
  IconClock,
  IconDotsV,
  IconGift,
  IconHeart,
  IconScan,
  IconTrendUp,
  IconUserPlus,
  IconUsers,
} from "@/app/t/[token]/_components/icons";
import { displayName } from "@/lib/format";
import { Avatar, BottomBanner, Card, IconTile, Sprinkles } from "./ui";
import { timeAgo } from "./config";

type StatCard = {
  label: string;
  value: number;
  delta: string;
  href: string;
  icon: "users" | "calendar" | "gift";
  tone: "mint" | "pink" | "lav";
};

export type ActivityItem = {
  id: string;
  name: string;
  kind: "visit" | "redeem" | "new";
  at: string;
};

const TONES = {
  mint: "bg-pastel-mint",
  pink: "bg-pastel-pink",
  lav: "bg-pastel-lav",
} as const;

const ICONS = {
  users: (p: { className?: string }) => <IconUsers {...p} />,
  calendar: (p: { className?: string }) => <IconCalendar {...p} />,
  gift: (p: { className?: string }) => <IconGift {...p} />,
};

const KIND = {
  visit: { label: "Registró una visita", tone: "sky" as const, icon: IconScan },
  redeem: { label: "Canjeó recompensa", tone: "pink" as const, icon: IconGift },
  new: { label: "Nuevo cliente", tone: "mint" as const, icon: IconUserPlus },
};

// Onda decorativa de las tarjetas de estadística.
function Wave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" aria-hidden>
      <path
        d="M0 30c15-14 30-14 45-5s30 9 45-2 20-15 30-12v29H0Z"
        fill="currentColor"
        opacity={0.25}
      />
      <path
        d="M0 34c18-10 36-10 54-3s36 8 52-2c8-5 12-8 14-8"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FruppyHome({
  slug,
  orgName,
  stats,
  activity,
  programName,
}: {
  slug: string;
  orgName: string;
  stats: StatCard[];
  activity: ActivityItem[];
  programName: string;
}) {
  const base = `/dashboard/${slug}`;

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#fbd3e4] via-pastel-pink to-[#f9c2d9] p-6 sm:p-8">
        <div className="relative z-10 max-w-md">
          <p className="text-xs font-bold tracking-[0.2em] text-accent">
            {orgName.toUpperCase()}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-4xl font-bold text-wine sm:text-5xl">
            ¡Bienvenido!
            <IconHeart className="size-8 text-accent sm:size-10" strokeWidth={2.4} />
          </h1>
          <p className="mt-2 text-sm font-medium text-navy/75 sm:text-base">
            Tu panel de fidelización para clientes más felices
          </p>
          <Link
            href={`${base}/programs`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-accent shadow-sm transition hover:shadow"
          >
            <IconHeart className="size-4" fill="currentColor" />
            Más momentos dulces juntos
            <IconChevron className="size-4" />
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-4 bottom-0 top-0 hidden w-[46%] sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/promo-1.jpg"
            alt=""
            className="h-full w-full object-cover [mask-image:linear-gradient(to_right,transparent,black_22%)]"
          />
          <Sprinkles className="absolute right-4 top-4 h-6 w-20 text-white/80" />
          <span className="absolute bottom-4 right-4 font-script text-2xl text-white drop-shadow-md">
            Helados que crean momentos especiales
          </span>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = ICONS[s.icon];
          return (
            <Link
              key={s.label}
              href={`${base}/${s.href}`}
              className={`relative overflow-hidden rounded-3xl p-4 shadow-sm transition hover:shadow-md sm:p-5 ${TONES[s.tone]}`}
            >
              <div className="flex items-start justify-between">
                <IconTile
                  tone={s.tone === "pink" ? "pink" : s.tone === "lav" ? "lav" : "teal"}
                  size="size-10"
                >
                  <Icon className="size-5" />
                </IconTile>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-navy/70">
                  <IconTrendUp className="size-3.5" />
                  {s.delta}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums text-navy sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-navy/60 sm:text-sm">
                {s.label}
              </p>
              <Wave
                className={`absolute -bottom-1 -right-2 h-10 w-24 ${
                  s.tone === "pink"
                    ? "text-[#f2a5c8]"
                    : s.tone === "lav"
                      ? "text-[#c3b3f0]"
                      : "text-[#8fd9ca]"
                }`}
              />
            </Link>
          );
        })}
      </section>

      {/* ===== Actividad + Fruppy Club ===== */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              <IconClock className="size-5" />
              Actividad reciente
            </h2>
            <Link
              href={`${base}/customers`}
              className="flex items-center text-sm font-semibold text-brand transition hover:text-brand-dark"
            >
              Ver todo →
            </Link>
          </div>

          <div className="hidden grid-cols-[2fr_2fr_1fr_auto] gap-3 px-2 pb-2 text-xs font-medium text-ink-soft md:grid">
            <span>Cliente</span>
            <span>Actividad</span>
            <span>Fecha y hora</span>
            <span className="text-right">Acciones</span>
          </div>

          <ul className="divide-y divide-neutral-100">
            {activity.map((a, i) => {
              const k = KIND[a.kind];
              const KIcon = k.icon;
              return (
                <li
                  key={a.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 md:grid-cols-[2fr_2fr_1fr_auto]"
                >
                  <span className="flex items-center gap-3">
                    <Avatar name={a.name} index={i} size="size-10" />
                    <span className="truncate font-semibold text-navy">
                      {displayName(a.name)}
                    </span>
                  </span>
                  <span className="hidden items-center gap-2 text-sm text-ink-soft md:flex">
                    <IconTile tone={k.tone} size="size-8">
                      <KIcon className="size-4" />
                    </IconTile>
                    {k.label}
                  </span>
                  <span className="text-xs text-ink-soft md:text-sm">
                    {timeAgo(a.at)}
                    <span className="block text-[11px] md:hidden">{k.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconTile tone={k.tone} size="size-8">
                      <KIcon className="size-4" />
                    </IconTile>
                    <span className="p-1 text-neutral-400">
                      <IconDotsV className="size-4" />
                    </span>
                  </span>
                </li>
              );
            })}
            {activity.length === 0 && (
              <li className="py-8 text-center text-sm text-ink-soft">
                Sin actividad todavía. Escanea la primera tarjeta.
              </li>
            )}
          </ul>
        </Card>

        {/* Tarjeta Fruppy Club */}
        <div className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-[#f6bcd4] to-pastel-pink p-5 shadow-sm lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/promo-1.jpg"
            alt=""
            className="absolute right-0 top-0 h-40 w-full object-cover opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <div className="relative">
            <h3 className="flex items-center gap-1.5 text-xl font-bold text-wine">
              {programName}
              <IconHeart className="size-5" />
            </h3>
            <p className="mt-0.5 text-sm font-medium text-navy/75">
              Cada visita nos endulza más
            </p>
            <div className="mt-24 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <IconTile tone="pink" size="size-10">
                  <IconGift className="size-5" />
                </IconTile>
                <div>
                  <p className="font-bold text-accent">Premia la fidelidad</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Programas de sellos o puntos para tus clientes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner móvil al pie */}
      <div className="lg:hidden">
        <BottomBanner
          title="Más momentos dulces juntos"
          text={`Gracias por ser parte de ${orgName}`}
          image="/brand/promo-1.jpg"
          tone="mint"
        />
      </div>
    </div>
  );
}
