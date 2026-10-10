// Íconos lineales estilo Feather, como en los mockups.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(p: P): P {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...p,
  };
}

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

export const IconGift = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v9h14v-9" />
    <path d="M12 8v13" />
    <path d="M12 8c-2.5 0-4.5-1.2-4.5-3S9.5 2.5 11 3.5c1 .7 1 2.5 1 4.5Zm0 0c2.5 0 4.5-1.2 4.5-3S14.5 2.5 13 3.5c-1 .7-1 2.5-1 4.5Z" />
  </svg>
);

export const IconQr = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h3" />
  </svg>
);

export const IconPercent = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 5 5 19" />
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="17" r="2.5" />
  </svg>
);

export const IconDots = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const IconBack = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9 5.5 4h13L20 9" />
    <path d="M4 9h16v3a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-6 0 2.5 2.5 0 0 1-5 0V9Z" />
    <path d="M6 14.5V21h12v-6.5" />
    <path d="M10 21v-5h4v5" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const IconCard = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>
);

export const IconHelp = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8" />
    <path d="M12 17h.01" />
  </svg>
);

export const IconChat = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" />
  </svg>
);

export const IconDoc = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3h8l4 4v14H6V3Z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
    <path d="m9.5 12 2 2 3.5-4" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4H6v16h8" />
    <path d="M10 12h11m0 0-3.5-3.5M21 12l-3.5 3.5" />
  </svg>
);

export const IconGear = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2.5 12h3M18.5 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
  </svg>
);

export const IconScan = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <path d="M4 12h16" />
  </svg>
);

export const IconStar = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1-5.6-3-5.6 3 1.2-6.1L3 9.6l6.3-.8L12 3Z" />
  </svg>
);

export const IconCone = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 13 12 21l5-8" />
    <path d="M9 16.5l2.5-2M10.5 19l3-3" />
    <circle cx="12" cy="8" r="4.5" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" />
  </svg>
);

export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z" />
  </svg>
);

// Fresa de los sellos: rellena o en contorno.
export function StampStrawberry({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {filled ? (
        <>
          <path
            d="M12 6.5C7.2 6.5 4 9.6 4 13.2c0 4.6 5.4 8.3 8 8.8 2.6-.5 8-4.2 8-8.8 0-3.6-3.2-6.7-8-6.7Z"
            fill="#ff5c74"
          />
          <path
            d="M12 6.8c-1.2-1.8-1-3.4-.2-4.8M6.5 8.2C8 6.4 10 5.6 12 5.6c2 0 4 .8 5.5 2.6l-2.6.6c-.9-1-1.9-1.4-2.9-1.4s-2 .4-2.9 1.4l-2.6-.6Z"
            fill="#3fae6a"
          />
          <g fill="#ffd3da">
            <ellipse cx="9" cy="11.5" rx=".8" ry="1.2" />
            <ellipse cx="15" cy="11.5" rx=".8" ry="1.2" />
            <ellipse cx="12" cy="13.5" rx=".8" ry="1.2" />
            <ellipse cx="9.8" cy="16" rx=".8" ry="1.2" />
            <ellipse cx="14.2" cy="16" rx=".8" ry="1.2" />
          </g>
        </>
      ) : (
        <>
          <path
            d="M12 6.5C7.2 6.5 4 9.6 4 13.2c0 4.6 5.4 8.3 8 8.8 2.6-.5 8-4.2 8-8.8 0-3.6-3.2-6.7-8-6.7Z"
            fill="none"
            stroke="#d9b8c0"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 6.8c-1.2-1.8-1-3.4-.2-4.8M6.5 8.2C8 6.4 10 5.6 12 5.6c2 0 4 .8 5.5 2.6l-2.6.6c-.9-1-1.9-1.4-2.9-1.4s-2 .4-2.9 1.4l-2.6-.6Z"
            fill="none"
            stroke="#d9b8c0"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
