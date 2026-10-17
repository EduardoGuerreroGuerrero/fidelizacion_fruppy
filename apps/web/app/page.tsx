// Landing pública — PineappleLoyalty.
// Replicación 1:1 de los mockups por sección en Muckup/landing page/.
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import {
  IconUsers,
  IconAward,
  IconChat,
  IconArrowRight,
  IconCheck,
  IconCheckCircle,
  IconChevronDown,
  IconQr,
  IconWallet,
  IconGift,
  IconBell,
  IconPin,
  IconMap,
  IconBars,
  IconPercent,
  IconBag,
  IconDumbbell,
  IconCup,
  IconScissors,
  IconInstagram,
  IconX,
  IconFacebook,
  IconYoutube,
  IconBolt,
  IconGear,
  IconHeadset,
  IconShield,
  IconBook,
  IconVideo,
  IconDoc,
  IconQuestion,
  IconSprout,
  IconStore,
  IconCard,
  IconCrown,
  IconPlay,
} from "./_landing/icons";
import {
  FakeQr,
  HeroPhone,
  ScanCard,
  Confetti,
  AdminLaptop,
  FormPhone,
  StatsPanel,
  VisQr,
  VisWallet,
  VisSellos,
  VisNotif,
  VisMap,
  VisSedes,
  VisCampana,
  VisReporte,
} from "./_landing/mockups";
import {
  CornerLeaves,
  UnderlineSwoosh,
  HandArrow,
  WaveBand,
  Leaf,
  Sparkle,
} from "./_landing/decorations";
import IntroVideo from "./_landing/intro";
import MobileMenu from "./_landing/mobile-menu";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export const metadata: Metadata = {
  title: "Pineapple Loyalty | Fidelización digital para comercios",
  description:
    "Crea tarjetas digitales de fidelización para Google Wallet, registra clientes con un QR y mide resultados en tiempo real. Sin app para tus clientes y con soporte en español.",
  openGraph: {
    title: "Pineapple Loyalty | Fidelización digital para comercios",
    description:
      "Convierte clientes ocasionales en clientes frecuentes con tarjetas digitales para Google Wallet.",
    images: ["/pineapple/logo.png"],
  },
  alternates: { canonical: "/" },
};

const NAV = [
  { label: "Inicio", href: "#inicio" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Funciones", href: "#funciones" },
  { label: "Precios", href: "#precios" },
  { label: "Sectores", href: "#sectores" },
] as const;

const RECURSOS_MENU = [
  { label: "Preguntas frecuentes", href: "/preguntas" },
  { label: "Contacto", href: "/contacto" },
] as const;

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full border border-pl-green/15 bg-pl-green-2/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-pl-green">
      {children}
    </span>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="#inicio" className="flex items-center gap-2">
      <Image
        src="/pineapple/isotipo-trans.png"
        alt="PineappleLoyalty"
        width={compact ? 26 : 32}
        height={compact ? 26 : 32}
        className={`${compact ? "h-6 w-6" : "h-8 w-8"} object-contain`}
      />
      <span className="leading-tight">
        <span
          className={`block font-bold tracking-tight text-ink ${compact ? "text-sm" : "text-[17px]"}`}
        >
          Pineapple<span className="text-pl-green-2">Loyalty</span>
        </span>
        {!compact && (
          <span className="block text-[9px] font-medium text-ink-soft">
            Make every visit count.
          </span>
        )}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-pl-green/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
        <BrandLogo />
        <nav
          className="hidden items-center gap-6 lg:ml-6 lg:flex"
          aria-label="Navegación principal"
        >
          {NAV.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="whitespace-nowrap text-sm font-medium text-ink-soft transition-colors hover:text-pl-green"
            >
              {n.label}
            </a>
          ))}
          <div className="group relative">
            <button className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-ink-soft transition-colors hover:text-pl-green">
              Recursos
              <IconChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <ul className="w-48 rounded-xl border border-pl-green/10 bg-white py-1.5 shadow-lg">
                {RECURSOS_MENU.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="block px-4 py-2 text-sm text-ink-soft hover:bg-pl-green-2/5 hover:text-pl-green"
                    >
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:ml-6">
          <Link
            href="/login"
            className="hidden whitespace-nowrap text-sm font-semibold text-ink-soft transition-colors hover:text-pl-green sm:inline-block"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-pl-green-2 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pl-green sm:flex"
          >
            Probar gratis
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
          <MobileMenu items={[...NAV]} />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const HERO_PERKS = [
  { icon: IconBolt, title: "Sin app para tus clientes", sub: "Funciona desde el navegador" },
  { icon: IconGear, title: "Configuración en minutos", sub: "Sin conocimientos técnicos" },
  { icon: IconHeadset, title: "Soporte en español", sub: "Te acompañamos en cada paso" },
];

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-pl-ivory">
      {/* Círculos y hojas decorativas */}
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-pl-cream/70" />
      <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-pl-cream/60" />
      <Leaf className="pointer-events-none absolute left-4 top-24 h-24 -rotate-[20deg] sm:left-10 sm:h-36" />
      <Leaf
        color="#22c55e"
        className="pointer-events-none absolute left-24 top-10 h-16 rotate-12 opacity-70 sm:left-36 sm:h-24"
      />
      <Leaf className="pointer-events-none absolute bottom-24 left-6 h-20 rotate-45 opacity-70" />
      <Leaf
        color="#22c55e"
        className="pointer-events-none absolute right-8 top-16 hidden h-28 rotate-[160deg] lg:block"
      />
      <Leaf className="pointer-events-none absolute bottom-40 right-24 hidden h-16 -rotate-[140deg] lg:block" />
      <Sparkle className="pointer-events-none absolute right-[42%] top-16 h-8 w-8" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-32 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pt-20">
        <div className="max-w-xl">
          <Chip>Programa de fidelización para comercios</Chip>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Convierte clientes ocasionales en{" "}
            <span className="relative inline-block text-pl-green">
              clientes frecuentes
              <UnderlineSwoosh />
            </span>
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-ink-soft">
            Con PineappleLoyalty creas tarjetas digitales para{" "}
            <strong className="font-semibold text-ink">Google Wallet</strong>,
            registra clientes con un simple código QR y mide resultados en
            tiempo real.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-full bg-pl-green-2 px-7 py-3.5 font-semibold text-white shadow-lg shadow-pl-green-2/25 transition hover:bg-pl-green"
            >
              Probar gratis
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-pl-green/25 px-7 py-3.5 font-semibold text-pl-green transition hover:border-pl-green hover:bg-pl-green/5"
            >
              Iniciar sesión
            </Link>
          </div>
          {/* Beneficios del hero */}
          <ul className="mt-12 grid gap-5 sm:grid-cols-3">
            {HERO_PERKS.map(({ icon: Ic, title, sub }, i) => (
              <li
                key={title}
                className={`flex items-start gap-3 ${i > 0 ? "sm:border-l sm:border-ink/10 sm:pl-5" : ""}`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-pl-green-2 text-pl-green-2">
                  <Ic className="h-4.5 w-4.5" strokeWidth={1.8} />
                </span>
                <span>
                  <span className="block text-sm font-bold leading-snug text-ink">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-soft">
                    {sub}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Composición de dispositivos */}
        <div className="relative mx-auto w-full max-w-md px-4 lg:px-0">
          <div className="pointer-events-none absolute left-0 top-14">
            <ScanCard />
          </div>
          <div className="relative z-10 ml-auto w-fit">
            <HeroPhone />
          </div>
          <Confetti />
        </div>
      </div>

      {/* Onda verde inferior */}
      <WaveBand className="relative -mb-px block h-16 w-full sm:h-20" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cómo funciona                                                       */
/* ------------------------------------------------------------------ */

const STEPS: { n: string; title: string; desc: string; Mock: ComponentType }[] = [
  {
    n: "1",
    title: "Configura tu programa",
    desc: "Define puntos, sellos y beneficios desde un panel web sencillo en pocos minutos.",
    Mock: AdminLaptop,
  },
  {
    n: "2",
    title: "Tus clientes se registran",
    desc: "Escanean tu QR, completan sus datos en segundos y reciben su tarjeta de fidelización.",
    Mock: FormPhone,
  },
  {
    n: "3",
    title: "Crece tu negocio",
    desc: "Visualiza resultados, envía promociones por segmento y aumenta la frecuencia de compra.",
    Mock: StatsPanel,
  },
];

const STEPS_PILLS = [
  { icon: IconGear, title: "Configuración en minutos", sub: "Sin conocimientos técnicos" },
  { icon: IconUsers, title: "Registro en segundos", sub: "Sin necesidad de una app" },
  { icon: IconBars, title: "Resultados en tiempo real", sub: "Toma mejores decisiones" },
];

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative scroll-mt-20 overflow-hidden bg-white py-20"
    >
      <CornerLeaves side="tl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Chip>Cómo funciona</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            ¿Cómo <span className="text-pl-green">funciona</span>?
          </h2>
          <p className="mt-4 text-ink-soft">
            En solo tres pasos puedes lanzar tu programa de fidelización.
          </p>
        </div>
        <ol className="mt-14 grid gap-12 lg:grid-cols-3 lg:gap-6">
          {STEPS.map(({ n, title, desc, Mock }, i) => (
            <li key={n} className="relative text-center">
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-pl-green-2 text-sm font-bold text-white">
                {n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
                {desc}
              </p>
              <div className="mt-6">
                <Mock />
              </div>
              {i < 2 && (
                <>
                  <IconChevronDown className="mx-auto mt-6 h-6 w-6 text-pl-green-2 lg:hidden" />
                  <IconArrowRight className="absolute -right-7 top-24 hidden h-8 w-8 rotate-[-20deg] text-pl-green-2 lg:block" />
                </>
              )}
            </li>
          ))}
        </ol>
        {/* Pills de beneficios rápidos */}
        <ul className="mt-16 grid gap-4 sm:grid-cols-3">
          {STEPS_PILLS.map(({ icon: Ic, title, sub }) => (
            <li
              key={title}
              className="flex items-center gap-3 rounded-2xl border border-pl-green-2/15 bg-pl-green-2/5 px-5 py-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-pl-green-2 text-pl-green-2">
                <Ic className="h-4.5 w-4.5" strokeWidth={1.8} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{title}</span>
                <span className="block text-xs text-ink-soft">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Funciones                                                           */
/* ------------------------------------------------------------------ */

const FEATURES: {
  icon: Icon;
  bg: string;
  title: string;
  desc: string;
  Visual: ComponentType;
}[] = [
  {
    icon: IconQr,
    bg: "bg-violet-50 text-violet-600",
    title: "Registro con código QR",
    desc: "Tus clientes se registran escaneando un código, sin descargar una app.",
    Visual: VisQr,
  },
  {
    icon: IconWallet,
    bg: "bg-sky-50 text-sky-600",
    title: "Tarjeta en Google Wallet",
    desc: "Cada cliente recibe su tarjeta digital directamente en Google Wallet.",
    Visual: VisWallet,
  },
  {
    icon: IconGift,
    bg: "bg-amber-50 text-amber-600",
    title: "Puntos o sellos",
    desc: "Configura tu programa con puntos acumulables o con sellos digitales.",
    Visual: VisSellos,
  },
  {
    icon: IconBell,
    bg: "bg-sky-50 text-sky-600",
    title: "Notificaciones push",
    desc: "Envía promociones directo al celular de tus clientes.",
    Visual: VisNotif,
  },
  {
    icon: IconPin,
    bg: "bg-emerald-50 text-emerald-600",
    title: "Ubicación en el mapa",
    desc: "Los clientes ven tus comercios cercanos directo desde el mapa.",
    Visual: VisMap,
  },
  {
    icon: IconMap,
    bg: "bg-rose-50 text-rose-500",
    title: "Programa multi-sede",
    desc: "Gestiona tu programa de fidelización en varias ubicaciones.",
    Visual: VisSedes,
  },
  {
    icon: IconChat,
    bg: "bg-violet-50 text-violet-600",
    title: "Campañas por segmento",
    desc: "Crea promociones dirigidas a grupos específicos de clientes.",
    Visual: VisCampana,
  },
  {
    icon: IconBars,
    bg: "bg-amber-50 text-amber-600",
    title: "Reportes y métricas",
    desc: "Conoce el rendimiento de tu programa con datos en tiempo real.",
    Visual: VisReporte,
  },
];

function Features() {
  return (
    <section
      id="funciones"
      className="relative scroll-mt-20 overflow-hidden bg-pl-ivory py-20"
    >
      <Leaf className="pointer-events-none absolute -left-4 top-8 h-24 -rotate-45 opacity-70 sm:h-32" />
      <Leaf color="#22c55e" className="pointer-events-none absolute left-12 top-16 h-14 rotate-12 opacity-60" />
      <Leaf className="pointer-events-none absolute -right-4 top-16 h-28 rotate-[135deg] opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Chip>Funciones principales</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            Todo lo que necesitas en{" "}
            <span className="text-pl-green">un solo lugar</span>
          </h2>
          <p className="mt-4 text-ink-soft">
            Herramientas simples y potentes para fidelizar clientes.
          </p>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Ic, bg, title, desc, Visual }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}
              >
                <Ic className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {desc}
              </p>
              <div className="mt-auto pt-4">
                <Visual />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Beneficios                                                          */
/* ------------------------------------------------------------------ */

const BENEFITS: { icon: Icon; title: string; desc: string }[] = [
  {
    icon: IconUsers,
    title: "Clientes frecuentes",
    desc: "Incentiva a tus clientes a volver con recompensas.",
  },
  {
    icon: IconAward,
    title: "Ventas recurrentes",
    desc: "Aumenta las visitas con promociones personalizadas.",
  },
  {
    icon: IconChat,
    title: "Conexión directa",
    desc: "Envía mensajes y promociones directo a sus celulares.",
  },
  {
    icon: IconCheckCircle,
    title: "Todo automático",
    desc: "Gestiona tu programa con actualizaciones automáticas.",
  },
];

function Benefits() {
  return (
    <section id="beneficios" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Chip>Beneficios</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            Beneficios de{" "}
            <span className="text-pl-green">PineappleLoyalty</span>
          </h2>
          <p className="mt-4 text-ink-soft">
            Herramientas prácticas para hacer crecer tu negocio.
          </p>
        </div>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Ic, title, desc }) => (
            <li key={title} className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pl-green-2/10 text-pl-green-2">
                <Ic className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sectores                                                            */
/* ------------------------------------------------------------------ */

const SECTORS: { icon: Icon; name: string; program: string }[] = [
  { icon: IconCup, name: "Cafeterías", program: "Sellos o puntos por compra" },
  { icon: IconScissors, name: "Barberías", program: "Sellos por servicio" },
  { icon: IconDumbbell, name: "Gimnasios", program: "Puntos por asistencia" },
  { icon: IconPercent, name: "Restaurantes", program: "Sellos por consumo" },
  { icon: IconBag, name: "Tiendas de ropa", program: "Puntos por compra" },
  { icon: IconCheck, name: "Servicios", program: "Puntos por contratación" },
];

function Sectors() {
  return (
    <section
      id="sectores"
      className="relative scroll-mt-20 overflow-hidden bg-pl-ivory py-20"
    >
      <Leaf className="pointer-events-none absolute -left-6 bottom-8 h-32 -rotate-30 opacity-60" />
      <Leaf color="#22c55e" className="pointer-events-none absolute right-8 top-10 h-24 rotate-[150deg] opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Chip>Sectores</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            Ideal para tu{" "}
            <span className="text-pl-green">tipo de negocio</span>
          </h2>
          <p className="mt-4 text-ink-soft">
            PineappleLoyalty se adapta a cualquier tipo de comercio.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map(({ icon: Ic, name, program }) => (
            <li
              key={name}
              className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-pl-green to-[#0b3d24] p-6 text-white"
            >
              <div className="text-center">
                <Ic className="mx-auto h-9 w-9" strokeWidth={1.5} />
                <p className="mt-3 text-lg font-bold">{name}</p>
                <p className="mt-1 text-[13px] text-white/75">{program}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Precios                                                             */
/* ------------------------------------------------------------------ */

const PLANS: {
  icon: Icon;
  name: string;
  price: string;
  tag: string;
  desc: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
}[] = [
  {
    icon: IconSprout,
    name: "Gratis",
    price: "$0",
    tag: "/mes",
    desc: "Prueba PineappleLoyalty sin costo.",
    features: [
      "1 programa de fidelización",
      "Registro con código QR",
      "Tarjeta para Google Wallet",
      "Hasta 50 clientes registrados",
      "Panel web básico",
    ],
    cta: "Crear cuenta gratis",
    href: "/signup",
  },
  {
    icon: IconBars,
    name: "Pro",
    price: "$29.000",
    tag: "/mes",
    desc: "Para negocios que empiezan a crecer.",
    features: [
      "Todo lo del plan Gratis",
      "Clientes ilimitados",
      "Notificaciones push",
      "Promociones por segmento",
      "Estadísticas de visitas",
      "Soporte prioritario",
    ],
    cta: "Probar 30 días gratis",
    href: "/signup",
    popular: true,
  },
  {
    icon: IconStore,
    name: "Business",
    price: "$59.000",
    tag: "/mes",
    desc: "Para negocios con varias sedes.",
    features: [
      "Todo lo del plan Pro",
      "Programa multi-sede",
      "Campañas automáticas",
      "Reportes avanzados",
      "Soporte personalizado",
    ],
    cta: "Contactar un asesor",
    href: "/contacto",
  },
];

const TRUST = [
  { icon: IconGear, title: "Sin contratos", sub: "Cancela cuando quieras" },
  { icon: IconCard, title: "Pago seguro", sub: "Múltiples métodos de pago" },
  { icon: IconHeadset, title: "Soporte en español", sub: "Por correo o chat" },
  {
    icon: IconShield,
    title: "Tus datos seguros",
    sub: "Cumplimiento de normativa en Colombia",
  },
];

function Pricing() {
  return (
    <section
      id="precios"
      className="relative scroll-mt-20 overflow-hidden bg-white py-20"
    >
      <CornerLeaves side="tl" />
      <Leaf className="pointer-events-none absolute bottom-16 right-4 h-24 rotate-[150deg] opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Nota manuscrita */}
        <div className="pointer-events-none absolute right-4 top-4 hidden flex-col items-center lg:flex">
          <p className="font-script text-xl text-pl-green-2">
            Escala tu programa
            <br />
            cuando lo necesites
          </p>
          <HandArrow className="mt-1 h-12 w-12" />
        </div>
        <div className="mx-auto max-w-2xl text-center">
          <Chip>Precios</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            Empieza <span className="text-pl-green">gratis</span> y{" "}
            <span className="text-pl-green">crece a tu ritmo</span>
          </h2>
          <p className="mt-4 text-ink-soft">
            Elige el plan que mejor se adapta a tu negocio. Sin contratos y con
            soporte en español.
          </p>
        </div>
        <ul className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map(
            ({ icon: Ic, name, price, tag, desc, features, cta, href, popular }) => (
              <li
                key={name}
                className={`relative flex flex-col rounded-3xl p-7 pt-10 ${
                  popular
                    ? "border-2 border-pl-green-2 bg-white shadow-xl shadow-pl-green-2/15"
                    : "border border-ink/10 bg-white shadow-sm"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-pl-green-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                    <IconCrown className="h-3.5 w-3.5" />
                    Más popular
                  </span>
                )}
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pl-green-2/10 text-pl-green-2">
                  <Ic className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-ink">{name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{desc}</p>
                <p className="mt-4">
                  <span className="text-3xl font-extrabold text-ink">
                    {price}
                  </span>
                  <span className="text-sm font-semibold text-ink-soft">
                    {" "}
                    {tag}
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-pl-green-2">
                        <IconCheck className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                      </span>
                      <span className="text-ink-soft">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`mt-7 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition ${
                    popular
                      ? "bg-pl-green-2 text-white shadow-md shadow-pl-green-2/30 hover:bg-pl-green"
                      : "border border-ink/15 text-ink hover:border-pl-green-2 hover:text-pl-green"
                  }`}
                >
                  {cta}
                  {popular && <IconArrowRight className="h-4 w-4" />}
                </Link>
              </li>
            ),
          )}
        </ul>
        {/* Barra de confianza */}
        <ul className="mt-12 grid gap-6 rounded-3xl border border-pl-green-2/15 bg-pl-green-2/5 px-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Ic, title, sub }) => (
            <li key={title} className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-pl-green-2 text-pl-green-2">
                <Ic className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-soft">
                  {sub}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Recursos                                                            */
/* ------------------------------------------------------------------ */

const RESOURCE_CARDS: { icon: Icon; bg: string; title: string; desc: string; href: string }[] = [
  {
    icon: IconBook,
    bg: "bg-emerald-50 text-emerald-600",
    title: "Guías paso a paso",
    desc: "Aprende a configurar tu programa de fidelización en minutos.",
    href: "/preguntas",
  },
  {
    icon: IconVideo,
    bg: "bg-amber-50 text-amber-600",
    title: "Videos tutoriales",
    desc: "Mira cómo usar cada función de Pineapple Loyalty.",
    href: "/preguntas",
  },
  {
    icon: IconDoc,
    bg: "bg-violet-50 text-violet-600",
    title: "Plantillas y material",
    desc: "Descarga recursos listos para usar en tu negocio.",
    href: "/contacto",
  },
  {
    icon: IconQuestion,
    bg: "bg-sky-50 text-sky-600",
    title: "Preguntas frecuentes",
    desc: "Encuentra respuestas rápidas a dudas comunes.",
    href: "/preguntas",
  },
];

const FEATURED_RESOURCES: {
  tag: string;
  tagBg: string;
  title: string;
  desc: string;
  Thumb: ComponentType;
  href: string;
}[] = [
  {
    tag: "GUÍA",
    tagBg: "bg-pl-green-2",
    title: "Cómo configurar tu programa de fidelización",
    desc: "Aprende paso a paso a crear tu programa desde el panel.",
    Thumb: ThumbAdmin,
    href: "/preguntas",
  },
  {
    tag: "VIDEO",
    tagBg: "bg-pl-yellow",
    title: "Cómo tus clientes se registran con el QR",
    desc: "Mira cómo tus clientes se unen en menos de un minuto.",
    Thumb: ThumbVideo,
    href: "/preguntas",
  },
  {
    tag: "PLANTILLA",
    tagBg: "bg-violet-500",
    title: "Mensajes listos para campañas",
    desc: "Usa plantillas para promocionar tus productos.",
    Thumb: ThumbPlantilla,
    href: "/contacto",
  },
  {
    tag: "GUÍA",
    tagBg: "bg-pl-green-2",
    title: "Cómo interpretar tus reportes",
    desc: "Aprende a usar tus métricas para tomar decisiones.",
    Thumb: ThumbReporte,
    href: "/preguntas",
  },
];

/* Miniaturas de los recursos destacados */
function ThumbAdmin() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-40 overflow-hidden rounded-lg border-2 border-neutral-700 bg-white shadow-md">
        <div className="flex">
          <div className="w-8 space-y-1 bg-pl-green p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="block h-1 rounded-sm bg-white/50" />
            ))}
          </div>
          <div className="flex-1 space-y-1 p-1.5">
            <span className="block h-1 w-3/4 rounded bg-neutral-200" />
            <span className="block h-1.5 w-full rounded-sm border border-neutral-200 bg-neutral-50" />
            <span className="block h-1.5 w-full rounded-sm border border-neutral-200 bg-neutral-50" />
            <span className="block h-1.5 w-2/3 rounded-sm border border-neutral-200 bg-neutral-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThumbVideo() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="w-16 rounded-[0.9rem] border-[3px] border-neutral-800 bg-white p-1.5 shadow-md">
        <div className="mx-auto w-10 rounded border border-neutral-100 p-0.5">
          <FakeQr />
        </div>
        <span className="mt-1 block h-1 rounded bg-neutral-200" />
        <span className="mt-0.5 block h-1 w-2/3 rounded bg-neutral-200" />
        <div className="mt-1 rounded-sm bg-pl-green-2 py-0.5 text-center text-[4px] font-bold text-white">
          Registrarme
        </div>
      </div>
      <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow">
        <IconPlay className="h-3.5 w-3.5 fill-pl-green text-pl-green" />
      </span>
      <span className="absolute bottom-2 right-3 rounded bg-neutral-900/80 px-1.5 py-0.5 text-[7px] font-semibold text-white">
        2:48
      </span>
    </div>
  );
}

function ThumbPlantilla() {
  return (
    <div className="flex h-full items-center justify-center gap-2">
      <div className="w-24 -rotate-3 rounded-lg border border-neutral-200 bg-white p-2 shadow-md">
        <Image
          src="/pineapple/isotipo-trans.png"
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 object-contain"
        />
        <p className="mt-1 text-[7px] font-bold text-ink">¡Vuelve y disfruta!</p>
        <p className="text-[5.5px] text-neutral-500">Gracias por tu visita</p>
      </div>
    </div>
  );
}

function ThumbReporte() {
  return (
    <div className="relative flex h-full items-end justify-center gap-2 pb-4">
      <div className="flex h-16 items-end gap-1">
        {[35, 55, 45, 70, 90].map((h, i) => (
          <span
            key={i}
            className={`w-3 rounded-t-sm ${i === 4 ? "bg-pl-green-2" : "bg-pl-green-2/40"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="absolute right-6 top-3">
        <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#22c55e"
            strokeWidth="6"
            strokeDasharray="70 100"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

const HOT_TOPICS = [
  "¿Necesito una app para mis clientes?",
  "¿Cómo creo un programa de sellos?",
  "¿Cómo funciona la tarjeta en Google Wallet?",
  "¿Puedo enviar promociones automáticas?",
  "¿Cómo funcionan los puntos?",
  "¿Puedo usarlo en varias sedes?",
  "¿Cómo ven mis clientes su tarjeta?",
  "¿Puedo cancelar cuando quiera?",
];

function Resources() {
  return (
    <section
      id="recursos"
      className="relative scroll-mt-20 overflow-hidden bg-pl-ivory py-20"
    >
      <Leaf className="pointer-events-none absolute left-2 top-24 h-28 -rotate-[30deg] opacity-60" />
      <Leaf color="#22c55e" className="pointer-events-none absolute left-14 top-40 h-16 rotate-6 opacity-50" />
      <Leaf className="pointer-events-none absolute right-4 top-12 h-28 rotate-[140deg] opacity-60" />
      <Leaf color="#22c55e" className="pointer-events-none absolute right-24 top-32 h-14 rotate-[170deg] opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Chip>Recursos</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            Todo lo que necesitas{" "}
            <span className="text-pl-green">para empezar</span>
          </h2>
          <p className="mt-4 text-ink-soft">
            Aprende a usar Pineapple Loyalty con guías, videos y recursos
            diseñados para dueños de negocio.
          </p>
        </div>

        {/* 4 tarjetas rápidas */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCE_CARDS.map(({ icon: Ic, bg, title, desc, href }) => (
            <li key={title}>
              <Link
                href={href}
                className="flex h-full flex-col rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}
                >
                  <Ic className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-4 font-bold text-ink">{title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
                  {desc}
                </p>
                <span className="mt-4 flex h-7 w-7 items-center justify-center rounded-full border border-pl-green-2 text-pl-green-2">
                  <IconArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Recursos destacados */}
        <div className="mt-16 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-ink">
            Recursos destacados
          </h3>
          <Link
            href="/preguntas"
            className="flex items-center gap-1 text-sm font-semibold text-pl-green-2 hover:text-pl-green"
          >
            Ver todos los recursos
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_RESOURCES.map(({ tag, tagBg, title, desc, Thumb, href }) => (
            <li key={title}>
              <Link
                href={href}
                className="block overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-36 bg-gradient-to-br from-pl-ivory to-pl-cream/50">
                  <span
                    className={`absolute left-3 top-3 z-10 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider text-white ${tagBg}`}
                  >
                    {tag}
                  </span>
                  <Thumb />
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-bold leading-snug text-ink">
                    {title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                    {desc}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Bloque de ayuda + temas consultados */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pl-green-2/10 text-pl-green-2">
              <IconHeadset className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-xl font-extrabold text-ink">
              ¿Necesitas ayuda?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Estamos aquí para apoyarte en cada paso de tu programa de
              fidelización.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/preguntas"
                className="flex items-center gap-2 rounded-full bg-pl-green-2 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-pl-green-2/25 transition hover:bg-pl-green"
              >
                Ir a preguntas frecuentes
              </Link>
              <Link
                href="/contacto"
                className="rounded-full border-2 border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-pl-green-2 hover:text-pl-green"
              >
                Contactar soporte
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-extrabold text-ink">
              Temas más consultados
            </h3>
            <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {HOT_TOPICS.map((t) => (
                <li key={t}>
                  <Link
                    href="/preguntas"
                    className="text-sm text-pl-green transition-colors hover:text-pl-green-2"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "¿Mis clientes necesitan descargar una aplicación?",
    a: "No. Tus clientes solo escanean un código QR, completan un formulario rápido y guardan su tarjeta en Google Wallet.",
  },
  {
    q: "¿Cuánto tarda en configurarse?",
    a: "Puedes lanzar tu programa en menos de 10 minutos desde el panel web.",
  },
  {
    q: "¿Puedo personalizar mi tarjeta de fidelización?",
    a: "Sí. Puedes elegir colores, logo, puntos, sellos y beneficios.",
  },
  {
    q: "¿Funciona para negocios con varias sedes?",
    a: "Sí. PineappleLoyalty permite administrar varias ubicaciones desde un solo panel.",
  },
  {
    q: "¿Puedo enviar promociones a mis clientes?",
    a: "Sí. Puedes enviar notificaciones y campañas segmentadas.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Chip>Preguntas frecuentes</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-4 text-ink-soft">
            Respuestas rápidas sobre PineappleLoyalty.
          </p>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-2xl border border-ink/10 bg-white px-6 py-5 open:border-pl-green-2/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <IconChevronDown className="h-5 w-5 shrink-0 text-pl-green-2 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link
            href="/preguntas"
            className="inline-flex items-center gap-2 font-semibold text-pl-green hover:text-pl-green-2"
          >
            Ver todas las preguntas
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA + Footer                                                        */
/* ------------------------------------------------------------------ */

function Cta() {
  return (
    <section className="bg-pl-ivory px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-pl-green px-6 py-14 text-center shadow-xl">
        <Leaf color="#1a7a48" className="pointer-events-none absolute -left-6 -top-6 h-32 rotate-45" />
        <Leaf color="#166534" className="pointer-events-none absolute -bottom-8 -right-6 h-36 -rotate-[135deg]" />
        <Leaf color="#1a7a48" className="pointer-events-none absolute -right-4 top-4 h-24 rotate-[160deg]" />
        <div className="relative">
          <Image
            src="/pineapple/isotipo-trans.png"
            alt=""
            width={72}
            height={72}
            className="mx-auto h-16 w-16 object-contain"
          />
          <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
            Convierte visitas en clientes frecuentes
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Comienza gratis y crea tu programa de fidelización digital.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-pl-yellow px-8 py-3.5 font-bold text-ink shadow-lg transition hover:bg-amber-300"
            >
              Probar gratis
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/50">
            Copyright © 2026 PineappleLoyalty · Hecho con dedicación en
            Barranquilla, Colombia
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="text-center lg:text-left">
            <BrandLogo />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Programa de fidelización digital para comercios.
            </p>
            <div className="mt-4 flex justify-center gap-3 lg:justify-start">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pl-green-2/10 text-pl-green-2"
                title="Instagram"
              >
                <IconInstagram className="h-4 w-4" />
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pl-green-2/10 text-pl-green-2"
                title="X"
              >
                <IconX className="h-4 w-4" />
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pl-green-2/10 text-pl-green-2"
                title="Facebook"
              >
                <IconFacebook className="h-4 w-4" />
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pl-green-2/10 text-pl-green-2"
                title="YouTube"
              >
                <IconYoutube className="h-4 w-4" />
              </span>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-bold text-ink">Producto</p>
              <a href="#como-funciona" className="block text-ink-soft hover:text-pl-green">
                Cómo funciona
              </a>
              <a href="#funciones" className="block text-ink-soft hover:text-pl-green">
                Funciones
              </a>
              <a href="#precios" className="block text-ink-soft hover:text-pl-green">
                Precios
              </a>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-ink">Recursos</p>
              <Link href="/preguntas" className="block text-ink-soft hover:text-pl-green">
                Preguntas frecuentes
              </Link>
              <Link href="/contacto" className="block text-ink-soft hover:text-pl-green">
                Contacto
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-ink">Legal</p>
              <Link
                href="/legal/terminos"
                className="block text-ink-soft hover:text-pl-green"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/legal/privacidad"
                className="block text-ink-soft hover:text-pl-green"
              >
                Política de privacidad
              </Link>
              <Link
                href="/legal/datos"
                className="block text-ink-soft hover:text-pl-green"
              >
                Tratamiento de datos
              </Link>
            </div>
          </nav>
        </div>
        <p className="mt-10 border-t border-ink/5 pt-6 text-center text-xs text-ink-soft">
          Copyright © 2026 PineappleLoyalty · Hecho con dedicación en
          Barranquilla, Colombia
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <>
      <IntroVideo />
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Benefits />
        <Sectors />
        <Pricing />
        <Resources />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
