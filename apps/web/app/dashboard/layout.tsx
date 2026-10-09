import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

// Rutas autenticadas: leen la sesión (cookies) en cada request → blocking,
// no prerender (Next 16 cacheComponents).
export const instant = false;

// Autorización REAL en servidor: el proxy solo hace chequeo optimista.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
        <span className="font-semibold">Fruppy</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-500">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
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
