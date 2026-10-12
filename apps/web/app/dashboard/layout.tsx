import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { DashboardChrome } from "./chrome-toggle";

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
    <DashboardChrome email={user.email ?? undefined} signOut={signOut}>
      {children}
    </DashboardChrome>
  );
}
