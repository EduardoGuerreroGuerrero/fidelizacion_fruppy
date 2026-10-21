import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "../_landing/shell";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";
import { sendContactMessage } from "@/lib/contact/actions";

export const metadata: Metadata = {
  title: "Contacto | PineappleLoyalty",
  description:
    "Contacta al equipo de PineappleLoyalty: soporte desde el panel o crea tu cuenta para empezar.",
};

const field =
  "mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-pl-green focus:ring-2 focus:ring-pl-green/30";

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
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
            Inicia sesión para gestionar tu programa. Si necesitas ayuda,
            escríbenos con el formulario de abajo e indica el nombre de tu
            comercio para que el equipo vea el contexto.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-pl-green/30 px-5 py-2.5 text-sm font-semibold text-pl-green transition hover:border-pl-green/60"
          >
            Iniciar sesión →
          </Link>
        </div>

        <div id="escribenos" className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-bold text-ink">Escríbenos</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Cuéntanos qué necesitas y te respondemos por correo en horario laboral.
          </p>
          {sent ? (
            <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              ¡Mensaje enviado! Te responderemos al correo que indicaste.
            </p>
          ) : (
            <RememberForm
              storageKey="contact"
              action={sendContactMessage}
              className="mt-4 space-y-3"
            >
              {error ? (
                <p role="alert" className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
                  {error}
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-ink">
                  Nombre
                  <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} />
                </label>
                <label className="text-sm text-ink">
                  Correo
                  <input name="email" type="email" required maxLength={120} autoComplete="email" className={field} />
                </label>
              </div>
              <label className="block text-sm text-ink">
                Tema
                <select name="topic" defaultValue="demo" className={field}>
                  <option value="demo">Quiero implementar PineappleLoyalty</option>
                  <option value="soporte">Soporte técnico</option>
                  <option value="facturacion">Planes y facturación</option>
                  <option value="datos">Datos personales / privacidad</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label className="block text-sm text-ink">
                Mensaje
                <textarea name="message" required minLength={10} maxLength={2000} rows={5} className={field} />
              </label>
              {/* Honeypot anti-spam: invisible para personas */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  No llenar
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <SubmitButton
                pendingText="Enviando…"
                className="inline-flex items-center gap-1.5 rounded-full bg-pl-green-2 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pl-green-2/90 disabled:opacity-60"
              >
                Enviar mensaje
              </SubmitButton>
              <p className="text-xs text-ink-soft">
                O escribe directo a{" "}
                <a className="font-medium text-pl-green" href="mailto:soporte@pineappleloyalty.com">
                  soporte@pineappleloyalty.com
                </a>
                .
              </p>
            </RememberForm>
          )}
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
