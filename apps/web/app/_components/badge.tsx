import type { ReactNode } from "react";

// Ficha de estado/canal del panel. Colores con contraste AA (texto oscuro
// sobre fondo claro de su tono): nunca depende del modo oscuro del teléfono.
const TONES = {
  neutral: "bg-neutral-100 text-neutral-700",
  success: "bg-green-100 text-green-900",
  info: "bg-sky-100 text-sky-900",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-900",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
