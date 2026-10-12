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

// ---- Iconos del panel admin-owner (mockups Fruppy Helados) ----

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
    <path d="M17.5 14.5a6.5 6.5 0 0 1 4 5.5" />
  </svg>
);

export const IconUserPlus = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20a7 7 0 0 1 14 0" />
    <path d="M18 8v6M15 11h6" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCoins = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </svg>
);

export const IconTag = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 4 6.5-.5L20 13l-7 7-9.5-9.5L4 4Z" />
    <circle cx="8.5" cy="8.5" r="1.5" />
  </svg>
);

export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="m14.5 5.5 4 4L8 20l-5 1 1-5L14.5 5.5Z" />
    <path d="m13 7 4 4" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5" />
    <path d="M4 19h16" />
  </svg>
);

export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5" />
    <path d="M4 19h16" />
  </svg>
);

export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 5-5.5" />
  </svg>
);

export const IconExternal = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M10 14 19 5m0 0h-5m5 0v5" />
  </svg>
);

export const IconDotsV = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
);

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const IconBulb = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 1 3.5 10.9c-.8.6-1.5 1.4-1.5 2.6V17h-4v-.5c0-1.2-.7-2-1.5-2.6A6 6 0 0 1 12 3Z" />
  </svg>
);

export const IconAward = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9" r="5" />
    <path d="m8.5 13-1.5 8 5-2.5L17 21l-1.5-8" />
    <path d="m12 6.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3L12 6.5Z" />
  </svg>
);

export const IconTrendUp = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 16 5-5 3.5 3.5L20 7" />
    <path d="M15 7h5v5" />
  </svg>
);

export const IconChartBar = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 16v-5M12 16V7M16 16v-3" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconPlusCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);

export const IconKeyboard = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M7 10h.01M11 10h.01M15 10h.01M19 10h.01M7 14h10" />
  </svg>
);

export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconArchive = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="5" rx="1" />
    <path d="M5 9v11h14V9" />
    <path d="M10 13h4" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" />
  </svg>
);

export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 9 7 7 7-7" />
  </svg>
);

export const IconStamp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a4 4 0 0 1 4 4c0 2.5-1 3.5-1 5h-6c0-1.5-1-2.5-1-5a4 4 0 0 1 4-4Z" />
    <path d="M9 12v3H7.5A2.5 2.5 0 0 0 5 17.5V19h14v-1.5a2.5 2.5 0 0 0-2.5-2.5H15v-3" />
    <path d="M4 21h16" />
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
