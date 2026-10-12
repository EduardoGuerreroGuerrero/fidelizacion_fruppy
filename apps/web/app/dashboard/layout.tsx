import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

// Rutas autenticadas: leen la sesión (cookies) en cada request → blocking,
// no prerender (Next 16 cacheComponents).
export const instant = false;

// Autorización REAL en servidor: el proxy solo hace chequeo optimista.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reclama invitaciones pendientes del email del usuario (idempotente).
  await supabase.rpc("claim_invites");

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa]">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-4 py-3 sm:px-6">
        {/* Nivel SaaS: la marca del comercio va en dashboard/[org]/layout,
            donde sí hay organización seleccionada. */}
        <span className="flex min-w-0 items-center gap-2.5 font-semibold text-ink">
          Fidelización
        </span>
        <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-4">
          <span className="hidden truncate text-ink-soft sm:inline">{user.email}</span>
          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              className="rounded-full bg-accent-soft px-4 py-1.5 font-medium text-accent transition hover:bg-accent/20"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}
