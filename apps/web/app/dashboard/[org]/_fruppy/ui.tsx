import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconHeart,
  IconHome,
} from "@/app/t/[token]/_components/icons";
import { AVATAR_STYLES, initials } from "./config";

/* ---------- piezas base ---------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl bg-white shadow-sm ring-1 ring-black/[0.04] ${className}`}>
      {children}
    </div>
  );
}

// Migas de pan: 🏠 / Fruppy Helados / Sección actual (teal).
export function Breadcrumb({
  orgName,
  base,
  current,
}: {
  orgName: string;
  base: string;
  current: string;
}) {
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Migas de pan">
      <Link href={base} aria-label="Inicio" className="text-ink-soft transition hover:text-brand">
        <IconHome className="size-4" />
      </Link>
      <span className="text-neutral-300">/</span>
      <Link href={base} className="font-medium text-ink-soft transition hover:text-brand">
        {orgName}
      </Link>
      <span className="text-neutral-300">/</span>
      <span className="font-semibold text-brand">{current}</span>
    </nav>
  );
}

// Encabezado de página: migas + título grande + subtítulo + arte a la derecha.
export function PageHead({
  orgName,
  base,
  current,
  title,
  subtitle,
  art,
  artLabel,
}: {
  orgName: string;
  base: string;
  current: string;
  title: string;
  subtitle: string;
  art?: string;
  artLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Breadcrumb orgName={orgName} base={base} current={current} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
      </div>
      {art ? (
        <div className="relative hidden shrink-0 sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art}
            alt=""
            className="h-24 w-40 rounded-2xl object-cover shadow-sm lg:h-28 lg:w-48"
          />
          {artLabel ? (
            <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2.5 py-1 font-script text-lg leading-none text-accent shadow-sm">
              {artLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Avatar({
  name,
  index = 0,
  size = "size-10",
  textSize = "text-xs",
}: {
  name: string;
  index?: number;
  size?: string;
  textSize?: string;
}) {
  const style = AVATAR_STYLES[index % AVATAR_STYLES.length];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${size} ${textSize} ${style}`}
    >
      {initials(name) || "?"}
    </span>
  );
}

// Chip de estado/etiqueta.
export function Chip({
  tone,
  children,
  className = "",
}: {
  tone: "green" | "teal" | "pink" | "lav" | "gray";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    green: "bg-chip-green text-chip-green-ink",
    teal: "bg-brand text-white",
    pink: "bg-pastel-pink text-accent",
    lav: "bg-pastel-lav text-[#7c5cd6]",
    gray: "bg-neutral-100 text-ink-soft",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// Marcas decorativas rosas tipo "sprinkles" de los mockups.
export function Sprinkles({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 24"
      className={`text-accent ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 12h8" />
      <path d="m22 4 5 8" />
      <path d="M40 4v8" />
      <path d="m58 4-5 8" />
      <path d="M68 12h8" />
    </svg>
  );
}

// Icono dentro de un cuadrado redondeado con tinte.
export function IconTile({
  tone,
  children,
  size = "size-10",
}: {
  tone: "teal" | "pink" | "lav" | "sky" | "peach" | "mint";
  children: ReactNode;
  size?: string;
}) {
  const tones = {
    teal: "bg-brand-soft text-brand-dark",
    mint: "bg-pastel-mint text-brand-dark",
    pink: "bg-pastel-pink text-accent",
    lav: "bg-pastel-lav text-[#7c5cd6]",
    sky: "bg-pastel-sky text-[#3f8fd2]",
    peach: "bg-pastel-cream text-[#d98a2b]",
  } as const;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl ${size} ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Banner promocional al pie de página (versión móvil de los mockups).
export function BottomBanner({
  title,
  highlight,
  text,
  image,
  tone = "pink",
}: {
  title: string;
  highlight?: string;
  text: string;
  image: string;
  tone?: "pink" | "mint";
}) {
  const bg =
    tone === "pink"
      ? "bg-gradient-to-br from-pastel-pink to-[#fbd3e4]"
      : "bg-gradient-to-br from-pastel-mint to-[#c8efe2]";
  return (
    <div className={`mt-8 flex items-center gap-4 overflow-hidden rounded-3xl p-5 ${bg}`}>
      <div className="min-w-0 flex-1">
        <p className="font-script text-2xl leading-tight text-wine">{title}</p>
        {highlight ? (
          <p className="font-script text-2xl leading-tight text-accent">{highlight}</p>
        ) : null}
        <p className="mt-1 text-sm text-navy/70">{text}</p>
        <IconHeart className="mt-2 size-5 text-accent" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-sm sm:h-28 sm:w-28"
      />
    </div>
  );
}
