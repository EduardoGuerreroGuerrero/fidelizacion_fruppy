import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/actions";
import { SubmitButton } from "@/app/_components/submit-button";
import { Turnstile } from "@/app/_components/turnstile";

export const instant = false;

export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  return (
    <>
      <h2 className="mb-1 text-lg font-semibold text-ink">Recuperar contraseña</h2>
      <p className="mb-4 text-sm text-ink-soft">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una
        contraseña nueva.
      </p>
      {notice ? (
        <p className="mb-4 rounded-xl bg-neutral-100 p-3 text-sm text-ink">{notice}</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl bg-accent-soft p-3 text-sm text-accent">{error}</p>
      ) : null}
      <form action={requestPasswordReset} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pl-green/50"
          />
        </label>
        <Turnstile />
        <SubmitButton className="rounded-full bg-pl-green py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pl-green/90">
          Enviar enlace
        </SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        <Link href="/login" className="font-medium text-pl-green">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}
