// Elementos decorativos de marca de los mockups: hojas, círculos crema,
// onda verde, subrayado amarillo y flecha manuscrita.


/** Hoja estilizada de piña (rellena, sin borde). */
export function Leaf({
  className = "",
  color = "#16a34a",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 60 100" fill="none" aria-hidden className={className}>
      <path
        d="M30 96C30 96 6 68 8 40 9.5 20 30 4 30 4s20.5 16 22 36c2 28-22 56-22 56Z"
        fill={color}
      />
      <path
        d="M30 90V16M30 40 18 30M30 55l-14-11M30 70 16 59M30 40l12-10M30 55l14-11M30 70l14-11"
        stroke="#0f5132"
        strokeOpacity="0.25"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Círculo crema/amarillo suave decorativo. */
export function Blob({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full bg-pl-cream ${className}`}
    />
  );
}

/** Brillito amarillo tipo sol (destello de 3 líneas). */
export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={className}
      stroke="#f59e0b"
      strokeWidth="3.5"
      strokeLinecap="round"
    >
      <path d="M8 4v8M20 2v5M32 4l-4 7" />
    </svg>
  );
}

/** Subrayado amarillo manuscrito bajo la palabra destacada del titular. */
export function UnderlineSwoosh({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 14"
      fill="none"
      aria-hidden
      className={`absolute -bottom-3.5 left-0 w-full ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M4 10C60 4 160 3 216 8"
        stroke="#fbbf24"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Flecha verde manuscrita que apunta hacia abajo-derecha (nota de precios). */
export function HandArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      aria-hidden
      className={className}
      stroke="#16a34a"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 10c14 4 28 16 32 38" />
      <path d="M42 50c-2-8-8-12-14-13M42 50c-8 2-14 0-18-4" />
    </svg>
  );
}

/** Onda verde al pie del hero. */
export function WaveBand({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      fill="none"
      aria-hidden
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M0 60C240 10 480 0 720 25c240 25 480 55 720 35v30H0Z"
        fill="#22c55e"
        fillOpacity="0.35"
      />
      <path
        d="M0 75C260 35 520 25 780 45c260 20 460 40 660 20v25H0Z"
        fill="#16a34a"
        fillOpacity="0.55"
      />
      <path d="M0 85c300-30 640-35 900-15 260 20 400 25 540 10v10H0Z" fill="#15803d" />
    </svg>
  );
}

/** Cluster decorativo de esquina: hojas + círculo crema. */
export function CornerLeaves({ side }: { side: "tl" | "tr" | "bl" | "br" }) {
  const pos = {
    tl: "left-0 top-0",
    tr: "right-0 top-0",
    bl: "left-0 bottom-0",
    br: "right-0 bottom-0",
  }[side];
  const flip = side === "tr" || side === "br" ? "-scale-x-100" : "";
  const vert = side === "bl" || side === "br" ? "rotate-180" : "";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${pos} h-40 w-40 overflow-hidden max-sm:hidden sm:h-56 sm:w-56`}
    >
      <div
        className={`absolute -inset-6 rounded-full bg-pl-cream/80 ${vert} ${flip}`}
        style={{ borderRadius: "0 0 100% 0" }}
      />
      <Leaf
        className={`absolute h-28 sm:h-40 ${side === "tl" || side === "bl" ? "left-2" : "right-2"} top-4 -rotate-12 ${flip}`}
      />
      <Leaf
        color="#22c55e"
        className={`absolute h-20 sm:h-28 ${side === "tl" || side === "bl" ? "left-16" : "right-16"} top-10 rotate-12 ${flip}`}
      />
    </div>
  );
}
