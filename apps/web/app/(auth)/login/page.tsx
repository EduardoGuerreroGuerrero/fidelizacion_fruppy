import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/auth/actions";
import { IconGoogle } from "../../_landing/icons";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; notice?: string }>;
}) {
  const { error, next, notice } = await searchParams;

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-ink">Iniciar sesión</h2>
      {notice ? (
        <p className="mb-4 rounded-xl bg-neutral-100 p-3 text-sm text-ink">
          {notice}
        </p>
      ) : null}
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
            className="rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pl-green/50"
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
            className="rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pl-green/50"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-pl-green py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pl-green/90"
        >
          Entrar
        </button>
      </form>
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="text-xs text-ink-soft">o continúa con</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <input type="hidden" name="from" value="/login" />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white py-3 text-sm font-semibold text-ink transition hover:bg-neutral-50"
        >
          <IconGoogle className="h-4 w-4" />
          Continuar con Google
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        ¿Sin cuenta?{" "}
        <Link href="/signup" className="font-medium text-pl-green">
          Registra tu comercio
        </Link>
      </p>
    </>
  );
}
