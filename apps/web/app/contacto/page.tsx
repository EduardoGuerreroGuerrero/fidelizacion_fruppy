import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../_landing/shell";

export const metadata: Metadata = {
  title: "Contacto | PineappleLoyalty",
  description:
    "Contacta al equipo de PineappleLoyalty: soporte desde el panel o crea tu cuenta para empezar.",
};

export default function ContactoPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Contacto
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Estamos para ayudarte con tu programa de fidelización.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-bold text-ink">¿Quieres implementar PineappleLoyalty?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Crea tu cuenta gratis y configura tu programa en minutos. Si tu
            negocio necesita acompañamiento (plan Business), el equipo te
            contacta después del registro.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pl-green-2 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pl-green-2/90"
          >
            Crear cuenta gratis →
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-bold text-ink">¿Ya tienes cuenta?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            El soporte se atiende desde el panel de tu organización: inicia
            sesión y usa el canal de ayuda para que el equipo vea el contexto
            de tu programa.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-pl-green/30 px-5 py-2.5 text-sm font-semibold text-pl-green transition hover:border-pl-green/60"
          >
            Iniciar sesión →
          </Link>
        </div>

        <p className="text-sm text-ink-soft">
          Antes de escribir, revisa las{" "}
          <Link href="/preguntas" className="font-medium text-pl-green">
            preguntas frecuentes
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
