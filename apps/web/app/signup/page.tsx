// Página de registro — replicación del mockup "Registro gratuito".
// Panel izquierdo de marca + formulario real (email/password + metadata).
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { signUp } from "@/lib/auth/actions";
import {
  IconArrowRight,
  IconBars,
  IconBolt,
  IconCheckCircle,
  IconGear,
  IconLock,
  IconQr,
  IconUser,
} from "../_landing/icons";
import { SignupVisual, TestimonialCard } from "../_landing/mockups";
import { Leaf } from "../_landing/decorations";
import PasswordInput from "./password-input";

export const instant = false;

export const metadata: Metadata = {
  title: "Crear cuenta gratis | Pineapple Loyalty",
  description:
    "Crea tu cuenta gratuita de PineappleLoyalty y configura tu programa de fidelización en minutos.",
};

const PERKS = [
  {
    icon: IconBolt,
    title: "Sin contratos",
    sub: "Empieza cuando quieras y cancela en cualquier momento.",
  },
  {
    icon: IconGear,
    title: "Configuración rápida",
    sub: "Tu programa estará listo en pocos minutos.",
  },
  {
    icon: IconQr,
    title: "QR incluido",
    sub: "Genera tu código QR para registrar clientes al instante.",
  },
  {
    icon: IconBars,
    title: "Plan gratuito",
    sub: "Comienza sin costo y escala cuando tu negocio crezca.",
  },
];

const BUSINESS_TYPES = [
  "Cafetería",
  "Restaurante",
  "Heladería",
  "Tienda o boutique",
  "Gimnasio",
  "Barbería o salón",
  "Otro",
];

const COUNTRIES = [
  "Colombia",
  "México",
  "Perú",
  "Chile",
  "Argentina",
  "Ecuador",
  "Otro",
];

const inputCls =
  "w-full rounded-xl border border-ink/10 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-pl-green-2 focus:ring-2 focus:ring-pl-green-2/30";
const labelCls = "mb-1.5 block text-[13px] font-semibold text-ink";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Panel de marca */}
      <section className="relative overflow-hidden bg-pl-ivory px-6 py-8 sm:px-10 lg:px-12">
        <Leaf className="pointer-events-none absolute -left-6 bottom-40 h-32 -rotate-45 opacity-50" />
        <Leaf
          color="#22c55e"
          className="pointer-events-none absolute right-4 top-24 h-24 rotate-[140deg] opacity-50"
        />
        <Link href="/" className="relative inline-flex items-center gap-2">
          <Image
            src="/pineapple/isotipo-trans.png"
            alt="PineappleLoyalty"
            width={30}
            height={30}
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-bold tracking-tight text-ink">
            Pineapple<span className="text-pl-green-2">Loyalty</span>
          </span>
        </Link>

        <div className="relative mt-10 max-w-md">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Crea tu cuenta y{" "}
            <span className="text-pl-green">comienza gratis</span>
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Lanza tu programa de fidelización en minutos y empieza a convertir
            clientes ocasionales en clientes frecuentes.
          </p>
          <ul className="mt-8 space-y-4">
            {PERKS.map(({ icon: Ic, title, sub }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-pl-green-2 text-pl-green-2">
                  <Ic className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">
                    {title}
                  </span>
                  <span className="block text-xs leading-snug text-ink-soft">
                    {sub}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 grid items-center gap-8 pb-14 lg:grid-cols-2">
          <TestimonialCard />
          <div className="hidden lg:block">
            <SignupVisual />
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-14">
        <p className="text-right text-sm text-ink-soft">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-pl-green hover:text-pl-green-2"
          >
            Iniciar sesión
          </Link>
        </p>

        <div className="mx-auto my-auto w-full max-w-md py-8">
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Comienza gratis y configura tu negocio en minutos.
          </p>

          {error ? (
            <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <form action={signUp} className="mt-7 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo">
                <div className="relative">
                  <input
                    name="full_name"
                    type="text"
                    required
                    autoComplete="name"
                    className={`${inputCls} pl-10`}
                  />
                  <IconUser className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </Field>
              <Field label="Correo electrónico">
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Contraseña">
              <PasswordInput />
            </Field>
            <Field label="Nombre de tu negocio">
              <input
                name="business"
                type="text"
                required
                autoComplete="organization"
                placeholder="Ej. Fruppy Helados"
                className={inputCls}
              />
            </Field>
            <Field label="Tipo de negocio">
              <select name="business_type" required className={inputCls}>
                <option value="">Selecciona una opción</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="País">
                <select name="country" required className={inputCls}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ciudad">
                <input
                  name="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  placeholder="Ej. Barranquilla"
                  className={inputCls}
                />
              </Field>
            </div>

            <label className="flex items-start gap-2.5 pt-1">
              <input
                name="terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-ink/20 accent-pl-green-2"
              />
              <span className="text-xs leading-relaxed text-ink-soft">
                Acepto los{" "}
                <Link
                  href="/legal/terminos"
                  className="font-semibold text-pl-green underline underline-offset-2"
                >
                  Términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  href="/legal/privacidad"
                  className="font-semibold text-pl-green underline underline-offset-2"
                >
                  Política de privacidad
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-pl-green-2 py-3.5 font-semibold text-white shadow-md shadow-pl-green-2/25 transition hover:bg-pl-green"
            >
              Crear cuenta gratis
              <IconArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 flex items-start justify-center gap-2 text-center text-[11px] leading-relaxed text-ink-soft">
            <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pl-green-2" />
            Tus datos están protegidos y son tratados de acuerdo con la
            normativa de protección de datos en Colombia.
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400">
            <IconCheckCircle className="h-3.5 w-3.5 text-pl-green-2" />
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>
      </section>
    </main>
  );
}
