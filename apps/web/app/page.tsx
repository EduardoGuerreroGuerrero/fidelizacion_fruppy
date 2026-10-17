import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import IntroVideo from "./_landing/intro";
import MobileMenu from "./_landing/mobile-menu";
import {
  IconArrowRight,
  IconAward,
  IconBag,
  IconBars,
  IconBell,
  IconChart,
  IconCheck,
  IconCheckCircle,
  IconChevronDown,
  IconCoffee,
  IconDumbbell,
  IconFacebook,
  IconFood,
  IconGrid,
  IconIceCream,
  IconInstagram,
  IconLinkedIn,
  IconMail,
  IconPin,
  IconPlay,
  IconQr,
  IconScissors,
  IconSend,
  IconStar,
  IconUsers,
  IconWallet,
  IconYoutube,
} from "./_landing/icons";
import {
  Confetti,
  FormPhone,
  HeroPhone,
  LaptopMockup,
  ScanCard,
  StatsPanel,
  SuccessCard,
} from "./_landing/mockups";

const NAV = [
  { label: "Inicio", href: "#inicio" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Funciones", href: "#funciones" },
  { label: "Precios", href: "#precios" },
];

function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className="text-pl-green">Pineapple</span>
      <span className="text-pl-green-2">Loyalty</span>
    </span>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-pl-green-2/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-pl-green-2">
      {children}
    </span>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="#inicio" className="flex items-center gap-2">
          <Image
            src="/pineapple/isotipo-trans.png"
            alt="PineappleLoyalty"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
          <Wordmark className="text-base sm:text-xl" />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-ink lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition hover:text-pl-green"
            >
              {item.label}
            </a>
          ))}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 transition hover:text-pl-green [&::-webkit-details-marker]:hidden">
              Recursos
              <IconChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-neutral-100 bg-white p-2 shadow-lg">
              <a
                href="#faq"
                className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-neutral-50"
              >
                Preguntas frecuentes
              </a>
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-neutral-50"
              >
                Blog
              </button>
            </div>
          </details>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-pl-green transition hover:text-pl-green-2 sm:block"
          >
            Iniciar sesión
          </Link>
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-full bg-pl-green-2 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pl-green-2/90 sm:flex"
          >
            Probar gratis
            <IconArrowRight className="h-4 w-4" />
          </button>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="inicio"
      className="relative scroll-mt-16 overflow-hidden bg-gradient-to-b from-pl-cream/70 via-pl-cream/30 to-white"
    >
      <div
        aria-hidden
        className="absolute -right-32 top-16 h-96 w-96 rounded-full bg-pl-yellow/20 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-pl-green/20 bg-white/70 px-3.5 py-1.5 text-[11px] font-medium text-pl-green">
            Programa de fidelización para comercios
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-pl-green sm:text-5xl lg:text-[3.4rem]">
            Convierte clientes ocasionales en{" "}
            <span className="text-pl-green-2">clientes frecuentes</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
            Crea tu propio programa de fidelización digital en minutos. Tus
            clientes se registran por QR, reciben su tarjeta en Google Wallet y
            vuelven por más.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-pl-green-2 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-pl-green-2/30 transition hover:bg-pl-green-2/90"
            >
              Probar gratis
              <IconArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#como-funciona"
              className="flex items-center gap-2 rounded-full border border-pl-green/25 bg-white px-6 py-3 text-sm font-semibold text-pl-green transition hover:border-pl-green/50"
            >
              <IconPlay className="h-5 w-5" />
              Ver cómo funciona
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-ink">
            {[
              "Sin app para tus clientes",
              "Configuración en minutos",
              "Soporte en español",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <IconCheckCircle className="h-4 w-4 text-pl-green-2" />
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-center py-6">
          <Confetti />
          <div className="absolute -left-2 top-1/2 hidden -translate-y-1/2 sm:block">
            <ScanCard />
          </div>
          <HeroPhone />
          <div className="absolute -right-1 top-[55%] z-10 w-36 -translate-y-1/2 sm:-right-6 sm:w-auto">
            <SuccessCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    {
      n: 1,
      title: "Configura tu programa",
      desc: "Personaliza tu tarjeta, define tus beneficios y genera tu código QR.",
      mockup: <LaptopMockup />,
    },
    {
      n: 2,
      title: "Tus clientes se registran",
      desc: "Escanean el QR, completan sus datos, reciben su tarjeta y comienzan a acumular puntos o sellos.",
      mockup: <FormPhone />,
    },
    {
      n: 3,
      title: "Haz crecer tu negocio",
      desc: "Envía promociones, mide resultados y mantén a tus clientes siempre cerca.",
      mockup: <StatsPanel />,
    },
  ];
  return (
    <section id="como-funciona" className="scroll-mt-16 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <Chip>Así de simple</Chip>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            ¿Cómo funciona?
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            En solo 3 pasos tu negocio estará fidelizando clientes.
          </p>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="contents">
              <div className="flex flex-col items-center text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pl-green-2 text-base font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 text-base font-bold text-ink">{s.title}</h3>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-soft">
                  {s.desc}
                </p>
                <div className="mt-5 flex w-full flex-1 items-end justify-center">
                  {s.mockup}
                </div>
              </div>
              {i < steps.length - 1 && (
                <>
                  <div className="hidden items-center lg:flex">
                    <IconArrowRight className="h-6 w-6 text-neutral-300" />
                  </div>
                  <div className="flex justify-center lg:hidden">
                    <IconChevronDown className="h-6 w-6 text-pl-green-2/60" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      icon: IconUsers,
      title: "Clientes que regresan",
      desc: "Incentiva la recompra con beneficios que realmente funcionan.",
    },
    {
      icon: IconMail,
      title: "Comunicación directa",
      desc: "Envía promociones y novedades a tus clientes (notificaciones y/o correo).",
    },
    {
      icon: IconChart,
      title: "Conoce a tus clientes",
      desc: "Accede a estadísticas y comportamientos de compra para tomar mejores decisiones.",
    },
    {
      icon: IconAward,
      title: "Todo en tu marca",
      desc: "Una experiencia 100% personalizada con tu logo, colores y estilo.",
    },
  ];
  return (
    <section id="beneficios" className="scroll-mt-16 bg-[#f3faf3] py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <Chip>Beneficios para tu negocio</Chip>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Más que una tarjeta, una herramienta para crecer
          </h2>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pl-green-2/15 text-pl-green-2">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: IconQr,
      bg: "bg-violet-100 text-violet-600",
      title: "Registro por QR",
      desc: "Tus clientes se registran solos, sin necesidad de una app.",
    },
    {
      icon: IconWallet,
      bg: "bg-sky-100 text-sky-600",
      title: "Tarjeta en Google Wallet",
      desc: "Emite tarjetas digitales compatibles con Google Wallet.",
    },
    {
      icon: IconStar,
      bg: "bg-amber-100 text-amber-500",
      title: "Puntos o sellos",
      desc: "Configura el tipo de programa que mejor se adapte a tu negocio.",
    },
    {
      icon: IconBell,
      bg: "bg-sky-100 text-sky-600",
      title: "Notificaciones por comercio",
      desc: "Envía promociones solo a tus propios clientes autorizados.",
    },
    {
      icon: IconPin,
      bg: "bg-emerald-100 text-emerald-600",
      title: "Solicita ubicación (opcional)",
      desc: "Para ofrecer promociones relevantes cerca de tu negocio.",
    },
    {
      icon: IconGrid,
      bg: "bg-rose-100 text-rose-500",
      title: "Gestión multi-sede",
      desc: "Administra varias sucursales desde un solo panel.",
    },
    {
      icon: IconSend,
      bg: "bg-violet-100 text-violet-600",
      title: "Campañas y segmentación",
      desc: "Llega al cliente correcto con el mensaje adecuado.",
    },
    {
      icon: IconBars,
      bg: "bg-amber-100 text-amber-500",
      title: "Reportes y estadísticas",
      desc: "Mide el crecimiento de tu programa en tiempo real.",
    },
  ];
  return (
    <section id="funciones" className="scroll-mt-16 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <Chip>Funciones principales</Chip>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Todo lo que necesitas en un solo lugar
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, bg, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-ink">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessTypes() {
  const items = [
    { icon: IconCoffee, label: "Cafeterías", bg: "from-amber-950 to-amber-800" },
    { icon: IconFood, label: "Restaurantes", bg: "from-orange-950 to-orange-800" },
    { icon: IconIceCream, label: "Heladerías", bg: "from-rose-950 to-rose-800" },
    { icon: IconBag, label: "Boutiques", bg: "from-purple-950 to-purple-800" },
    { icon: IconDumbbell, label: "Gimnasios", bg: "from-slate-900 to-slate-700" },
    { icon: IconScissors, label: "Barberías", bg: "from-neutral-900 to-neutral-700" },
  ];
  return (
    <section id="negocios" className="scroll-mt-16 bg-white pb-16 lg:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <Chip>Comercios que ya confían</Chip>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Ideal para cualquier tipo de negocio
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Cafeterías, restaurantes, heladerías, barberías, boutiques, gimnasios
            y muchos más.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map(({ icon: Icon, label, bg }) => (
            <div
              key={label}
              className={`group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${bg}`}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-20 transition group-hover:scale-110"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 70% 20%, rgba(255,255,255,.5), transparent 55%)",
                }}
              />
              <Icon className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-[70%] text-white/85" />
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Gratis",
      tag: "Ideal para comenzar",
      price: "$0",
      features: [
        "1 programa",
        "Hasta 100 clientes",
        "QR de registro",
        "Reportes básicos",
      ],
      cta: "Crear cuenta gratis",
      highlight: false,
    },
    {
      name: "Pro",
      tag: "Para negocios en crecimiento",
      price: "$29.000",
      features: [
        "Programas ilimitados",
        "Clientes ilimitados",
        "Notificaciones por comercio",
        "Campañas y segmentación",
        "Reportes avanzados",
        "Soporte prioritario",
      ],
      cta: "Probar 30 días gratis",
      highlight: true,
    },
    {
      name: "Business",
      tag: "Para múltiples sedes",
      price: "$59.000",
      features: [
        "Todo lo de Pro",
        "Gestión multi-sede",
        "Roles de equipo",
        "Integraciones (POS, etc.)",
        "Acompañamiento en implementación",
      ],
      cta: "Contactar un asesor",
      highlight: false,
    },
  ];
  return (
    <section id="precios" className="scroll-mt-16 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <Chip>Planes y precios</Chip>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Empieza gratis y crece a tu ritmo
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl bg-white p-6 ${
                p.highlight
                  ? "border-2 border-pl-green-2 shadow-xl shadow-pl-green-2/15"
                  : "border border-neutral-200 shadow-sm"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pl-green-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Más popular
                </span>
              )}
              <h3 className="text-lg font-bold text-ink">{p.name}</h3>
              <p className="text-xs text-ink-soft">{p.tag}</p>
              <p className="mt-4 text-3xl font-extrabold text-ink">
                {p.price}
                <span className="text-sm font-medium text-ink-soft"> / mes</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-xs text-ink"
                  >
                    <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pl-green-2" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-6 rounded-full py-2.5 text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-pl-green-2 text-white shadow-md shadow-pl-green-2/30 hover:bg-pl-green-2/90"
                    : "border border-neutral-300 text-ink hover:border-pl-green/50 hover:text-pl-green"
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "¿Mis clientes necesitan una app?",
      a: "No. Se registran escaneando un código QR y su tarjeta vive en Google Wallet, sin instalar nada adicional.",
    },
    {
      q: "¿Puedo enviar promociones a mis clientes?",
      a: "Sí. Puedes enviar notificaciones y correos solo a tus propios clientes que hayan autorizado la comunicación.",
    },
    {
      q: "¿Cómo se registran mis clientes?",
      a: "Escanean el QR de tu comercio, completan sus datos y reciben su tarjeta digital al instante.",
    },
    {
      q: "¿Qué incluye el plan gratis?",
      a: "1 programa de fidelización, hasta 100 clientes, QR de registro y reportes básicos. Para siempre.",
    },
  ];
  return (
    <section id="faq" className="scroll-mt-16 bg-white pb-16 lg:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Chip>Preguntas frecuentes</Chip>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Resolvemos tus dudas
            </h2>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-pl-green/30 px-4 py-2 text-xs font-semibold text-pl-green transition hover:border-pl-green/60"
          >
            Ver todas las preguntas
            <IconArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-neutral-200 bg-white px-5 py-4 open:border-pl-green/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <IconChevronDown className="h-4 w-4 shrink-0 text-ink-soft transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-white pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-pl-green to-[#0b3d24] px-8 py-10 sm:flex-row sm:items-center sm:px-12">
          <Image
            src="/pineapple/isotipo-trans.png"
            alt=""
            width={72}
            height={72}
            className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
          />
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              ¿Listo para fidelizar a tus clientes?
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Crea tu programa en minutos y comienza a ver resultados.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-pl-yellow px-6 py-3 text-sm font-bold text-ink shadow-lg transition hover:bg-pl-yellow/90"
          >
            Probar gratis
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contacto" className="border-t border-neutral-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 sm:px-6">
        <Link href="#inicio" className="flex items-center gap-2">
          <Image
            src="/pineapple/isotipo-trans.png"
            alt="PineappleLoyalty"
            width={30}
            height={30}
            className="h-7 w-7 object-contain"
          />
          <Wordmark className="text-base" />
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-ink">
          <a href="#inicio" className="hover:text-pl-green">Inicio</a>
          <a href="#funciones" className="hover:text-pl-green">Funciones</a>
          <a href="#precios" className="hover:text-pl-green">Precios</a>
          <button type="button" className="hover:text-pl-green">Blog</button>
          <a href="#contacto" className="hover:text-pl-green">Contacto</a>
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
            <Link href="/legal/terminos" className="hover:text-pl-green">
              Términos
            </Link>
            <Link href="/legal/privacidad" className="hover:text-pl-green">
              Privacidad
            </Link>
            <Link href="/legal/datos" className="hover:text-pl-green">
              Tratamiento de datos (Colombia)
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-ink-soft">
            <button type="button" aria-label="Instagram" className="hover:text-pl-green">
              <IconInstagram className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Facebook" className="hover:text-pl-green">
              <IconFacebook className="h-4 w-4" />
            </button>
            <button type="button" aria-label="LinkedIn" className="hover:text-pl-green">
              <IconLinkedIn className="h-4 w-4" />
            </button>
            <button type="button" aria-label="YouTube" className="hover:text-pl-green">
              <IconYoutube className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export const metadata: Metadata = {
  title: "Pineapple Loyalty | Fidelización digital para comercios",
  description:
    "Crea un programa de fidelización digital para tu negocio con registro por QR, tarjeta en Google Wallet y herramientas para gestionar la relación con tus clientes.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Pineapple Loyalty | Fidelización digital para comercios",
    description:
      "Crea un programa de fidelización digital para tu negocio con registro por QR y tarjeta en Google Wallet.",
    type: "website",
    locale: "es_CO",
    images: [{ url: "/pineapple/logo.png", alt: "PineappleLoyalty" }],
  },
};

export default function Home() {
  return (
    <>
      <IntroVideo />
      <Header />
      <main>
        <Hero />
        <Steps />
        <Benefits />
        <Features />
        <BusinessTypes />
        <Pricing />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
