// Íconos lineales estilo Feather para la landing PineappleLoyalty.
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

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.7 2.7L16.5 9" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
);

export const IconPlay = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5v7l5.5-3.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.6c1.7.8 2.5 2.2 2.5 4" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 15l4-4 3 3 5-6" />
  </svg>
);

export const IconAward = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="m8.8 13.5-1.3 7 4.5-2.6 4.5 2.6-1.3-7" />
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

export const IconWallet = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>
);

export const IconStar = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9Z" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.2-6.5-10a6.5 6.5 0 1 1 13 0c0 4.8-6.5 10-6.5 10Z" />
    <circle cx="12" cy="10.5" r="2.5" />
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

export const IconSend = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10Z" />
  </svg>
);

export const IconBars = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 20v-6M11 20V8M16 20v-9M21 20H3" />
  </svg>
);

export const IconCoffee = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" />
    <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 5.5c0-1 .8-1 .8-2M12 5.5c0-1 .8-1 .8-2" />
  </svg>
);

export const IconFood = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 15a8 8 0 0 1 16 0Z" />
    <path d="M2 15h20M12 7V5M9 5.5h6" />
    <path d="M7 18.5h10" />
  </svg>
);

export const IconIceCream = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 11a5 5 0 0 1 10 0" />
    <path d="M7 11h10l-5 10Z" />
    <path d="M12 6V4" />
  </svg>
);

export const IconBag = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 8h14l-1.2 12.5a1.5 1.5 0 0 1-1.5 1.5H7.7a1.5 1.5 0 0 1-1.5-1.5Z" />
    <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
  </svg>
);

export const IconDumbbell = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 7v10M4 9v6M17 7v10M20 9v6M7 12h10" />
  </svg>
);

export const IconScissors = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M8.2 7.7 20 18M8.2 16.3 20 6M14.5 12.7l-1.8-1.4" />
  </svg>
);

export const IconInstagram = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.2 6.8h.01" />
  </svg>
);

export const IconFacebook = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V2.5h-2.5A4.5 4.5 0 0 0 10 7v1.5H7.5V12H10v9.5h4V12h2.7l.8-3.5Z" />
  </svg>
);

export const IconLinkedIn = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 10.5V17M8 7.5v.01M12 17v-4a2.5 2.5 0 0 1 5 0v4M12 10.5V17" />
  </svg>
);

export const IconYoutube = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
    <path d="M10.5 9.5v5l4.5-2.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2.5 5 13.5h5.5L11 21.5l8-11h-5.5Z" />
  </svg>
);

export const IconGear = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
  </svg>
);

export const IconHeadset = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 13a8 8 0 0 1 16 0" />
    <rect x="3" y="12" width="4" height="6" rx="1.8" />
    <rect x="17" y="12" width="4" height="6" rx="1.8" />
    <path d="M20 18v1.5a2.5 2.5 0 0 1-2.5 2.5H13" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5.5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6Z" />
    <path d="m9 12 2.2 2.2L15.5 9.5" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21Z" />
    <path d="M4 5.5V21M20 18.5H6.5A2.5 2.5 0 0 0 4 21" />
  </svg>
);

export const IconDoc = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3h8l4 4v14H6Z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </svg>
);

export const IconQuestion = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8" />
    <path d="M12 16.8v.01" />
  </svg>
);

export const IconSprout = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21v-8" />
    <path d="M12 13c0-4 3-7 8-7 0 4-3 7-8 7ZM12 13c0-4-3-7-8-7 0 4 3 7 8 7Z" />
  </svg>
);

export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9 5.5 4h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6" />
  </svg>
);

export const IconCard = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3 10h18M6.5 15h4" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconEyeOff = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4l16 16M10.6 6C11 .6 11.5 5.5 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4M6.6 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1 0 2-.2 2.8-.5" />
    <path d="M9.9 10.4a3 3 0 0 0 4.1 4.1" />
  </svg>
);

export const IconCrown = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8 8 11l4-6 4 6 4-3-1.5 11h-13Z" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconChat = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L4 21l1.9-4.6A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
);

export const IconGift = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="11" width="16" height="9" rx="1.5" />
    <path d="M3.5 7.5h17V11h-17ZM12 7.5V20M12 7.5C12 5 10.5 3 8.5 3S6 5 7.5 6.5C8.7 7.7 12 7.5 12 7.5ZM12 7.5C12 5 13.5 3 15.5 3S18 5 16.5 6.5C15.3 7.7 12 7.5 12 7.5Z" />
  </svg>
);

export const IconMap = (p: P) => (
  <svg {...base(p)}>
    <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2ZM9 4v14M15 6v14" />
  </svg>
);

export const IconPercent = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 5 5 19" />
    <circle cx="7.5" cy="7.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

export const IconCup = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 5h11v6a5.5 5.5 0 0 1-11 0Z" />
    <path d="M16 7h2.5a2.5 2.5 0 0 1 0 5H16M7 20h10M12 16v4" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4l16 16M20 4 4 20" />
  </svg>
);

export const IconVideo = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10.5 21 8v8l-5-2.5" />
  </svg>
);

/** "G" oficial de Google (4 colores) para el botón OAuth. */
export const IconGoogle = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
    />
  </svg>
);

/** "G" estilo Google Wallet para el botón de añadir tarjeta. */
export const IconGWallet = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
    <rect x="3" y="7" width="18" height="12" rx="3" fill="#4285F4" />
    <rect x="3" y="9.5" width="18" height="2.5" fill="#FBBC04" />
    <circle cx="16.5" cy="15.5" r="2" fill="#EA4335" />
    <circle cx="18.8" cy="15.5" r="2" fill="#34A853" fillOpacity="0.85" />
  </svg>
);

export const IconBread = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10a8 5 0 0 1 16 0c0 1.2-.8 2-2 2v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7c-1.2 0-2-.8-2-2Z" />
  </svg>
);

export const IconUtensils = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3v5a2 2 0 0 0 4 0V3M7 10v11" />
    <path d="M17 21V3c-2 2-3 5-3 8h3" />
  </svg>
);

export const IconBriefcase = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
  </svg>
);
