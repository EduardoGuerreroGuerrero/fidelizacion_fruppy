import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { DashboardChrome } from "./chrome-toggle";

// Rutas autenticadas: leen la sesión (cookies) en cada request → blocking,
// no prerender (Next 16 cacheComponents).
export const instant = false;

// Autorización REAL en servidor: el proxy solo hace chequeo optimista.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  // claim_invites ya NO corre aquí: el layout se renderiza en cada carga y
  // tras cada server action, y esa RPC sumaba una ida y vuelta a la BD en
  // cada clic. Ahora se reclama en /dashboard (selector de organizaciones)
  // y en el layout del org solo si el usuario aún no es miembro.

  return (
    // .pl-panel: tokens con contraste AA solo para el panel (ver globals.css).
    <div className="pl-panel contents">
      <DashboardChrome email={user.email ?? undefined} signOut={signOut}>
        {children}
      </DashboardChrome>
    </div>
  );
}
