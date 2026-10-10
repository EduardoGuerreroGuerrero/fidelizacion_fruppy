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
      <header className="flex items-center justify-between border-b border-neutral-100 bg-white px-6 py-3">
        <span className="flex items-center gap-2.5 font-semibold text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-circle.jpg"
            alt=""
            className="size-9 rounded-full shadow-sm"
          />
          Fruppy
        </span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-soft">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full bg-accent-soft px-4 py-1.5 font-medium text-accent transition hover:bg-accent/20"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
