import Link from "next/link";
import { signIn } from "@/lib/auth/actions";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-ink">Iniciar sesión</h2>
      {error ? (
        <p className="mb-4 rounded-xl bg-accent-soft p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}
      <form action={signIn} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <label className="flex flex-col gap-1 text-sm text-ink">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-brand/50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-brand/50"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          Entrar
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        ¿Sin cuenta?{" "}
        <Link href="/signup" className="font-medium text-brand">
          Registra tu comercio
        </Link>
      </p>
    </>
  );
}
