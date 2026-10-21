import type { ReactNode } from "react";
import { FRUPPY_SLUG, initials } from "@/app/dashboard/[org]/_fruppy/config";
import type { CardAppData } from "./data";
import { IconGift, IconPin } from "./icons";

export type BrandInfo = Pick<CardAppData, "org_id" | "org_name" | "org_slug" | "has_logo">;

// Las fotos de producto y la fachada de /public/brand son de Fruppy Helados:
// solo se muestran a sus clientes. El resto de comercios usa su logo o
// alternativas neutras.
export const isFruppy = (c: { org_slug?: string }) => c.org_slug === FRUPPY_SLUG;

// Logo del comercio: su PNG subido (/logo/[orgId]); Fruppy conserva el suyo;
// sin logo, un badge con las iniciales.
export function BrandLogo({ brand, className }: { brand: BrandInfo; className: string }) {
  if (brand.has_logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/logo/${brand.org_id}`}
        alt={brand.org_name}
        className={`${className} w-auto object-contain drop-shadow-md`}
      />
    );
  }
  if (isFruppy(brand)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/logo.png"
        alt={brand.org_name}
        className={`${className} w-auto object-contain drop-shadow-md`}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={brand.org_name}
      className={`${className} flex aspect-square items-center justify-center rounded-full bg-white/90 text-lg font-bold text-brand-dark shadow-md`}
    >
      {initials(brand.org_name)}
    </span>
  );
}

// Miniatura de recompensa: foto de helado (Fruppy) o ícono de regalo.
export function RewardThumb({
  fruppy,
  n,
  className,
}: {
  fruppy: boolean;
  n: number;
  className: string;
}) {
  if (fruppy) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/brand/bono-icon-${n}.jpg`} alt="" className={`${className} object-cover`} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center bg-white/70 text-brand-dark [&>svg]:size-1/2`}
    >
      <IconGift />
    </span>
  );
}

// Miniatura de sede: foto (Fruppy) o ícono de ubicación.
export function LocationThumb({
  fruppy,
  index,
  name,
  className,
}: {
  fruppy: boolean;
  index: number;
  name: string;
  className: string;
}): ReactNode {
  if (fruppy) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/brand/loc-${(index % 3) + 1}.jpg`}
        alt={name}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center bg-brand-soft text-brand-dark [&>svg]:size-1/3`}
    >
      <IconPin />
    </span>
  );
}

// Banner decorativo de sección: solo Fruppy (arte propio).
export function SectionBanner({
  fruppy,
  src,
  alt,
  className,
}: {
  fruppy: boolean;
  src: string;
  alt: string;
  className: string;
}): ReactNode {
  if (!fruppy) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
