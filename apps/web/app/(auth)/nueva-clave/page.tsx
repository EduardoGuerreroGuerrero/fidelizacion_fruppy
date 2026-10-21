import { redirect } from "next/navigation";
import { updatePassword } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/app/_components/submit-button";

export const instant = false;

// Solo con la sesión de recuperación que crea /auth/callback.
export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      "/recuperar?error=" +
        encodeURIComponent("El enlace venció o se abrió en otro navegador. Solicita uno nuevo."),
    );
  }

  return (
    <>
      <h2 className="mb-1 text-lg font-semibold text-ink">Crea tu contraseña nueva</h2>
      <p className="mb-4 text-sm text-ink-soft">Cuenta: {user.email}</p>
      {error ? (
        <p className="mb-4 rounded-xl bg-accent-soft p-3 text-sm text-accent">{error}</p>
      ) : null}
      <form action={updatePassword} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink">
          Contraseña nueva
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pl-green/50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Repite la contraseña
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pl-green/50"
          />
        </label>
        <SubmitButton className="rounded-full bg-pl-green py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pl-green/90">
          Guardar contraseña
        </SubmitButton>
      </form>
    </>
  );
}
