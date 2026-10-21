import type { CSSProperties } from "react";

// Color de tarjeta cuando el comercio no eligió uno: verde PineappleLoyalty,
// contraste con texto blanco ≥ 9:1 (WCAG AA exige 4.5:1).
export const DEFAULT_BRAND_COLOR = "#0f5132";

const HEX = /^#[0-9a-fA-F]{6}$/;

function mix(hex: string, to: number, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(c + (to - c) * t),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Variables CSS de marca de un comercio (app del cliente). Sin color válido
// devuelve undefined y se conserva la paleta por defecto del tema.
export function brandVars(color?: string | null): CSSProperties | undefined {
  if (!color || !HEX.test(color)) return undefined;
  return {
    "--color-brand": color,
    "--color-brand-dark": mix(color, 0, 0.18),
    "--color-brand-deeper": mix(color, 0, 0.4),
    "--color-brand-soft": mix(color, 255, 0.85),
  } as CSSProperties;
}
