import { initials } from "@/lib/format";
import type { CardAppData } from "./data";
import { IconGift, IconPin } from "./icons";

export type BrandInfo = Pick<CardAppData, "org_id" | "org_name" | "org_slug" | "has_logo">;

// Logo del comercio: su PNG subido (/logo/[orgId]); sin logo, un badge con
// las iniciales. Nunca imágenes de otro comercio.
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

// Miniatura de recompensa: ícono de regalo con el color del comercio.
export function RewardThumb({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center bg-white/70 text-brand-dark [&>svg]:size-1/2`}
    >
      <IconGift />
    </span>
  );
}

// Miniatura de sede: ícono de ubicación con el color del comercio.
export function LocationThumb({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center bg-brand-soft text-brand-dark [&>svg]:size-1/3`}
    >
      <IconPin />
    </span>
  );
}
