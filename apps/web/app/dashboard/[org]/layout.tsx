import { createClient } from "@/lib/supabase/server";
import { OrgNav } from "./nav";

export const instant = false;

// Navegación por rol. La autorización real va server-side en cada página y
// en las policies/RPCs — ocultar opciones aquí es solo UX (defensa ya existe).
// Menú principal: máx. 4 tareas frecuentes. El resto va a la línea "Más".
const NAV_BASE = [
  ["", "Inicio"],
  ["scan", "Registrar visita"],
  ["customers", "Clientes"],
] as const;

const NAV_ADMIN_PRIMARY = [["programs", "Programa"]] as const;

const NAV_SECONDARY_BASE = [["analytics", "Analítica"]] as const;

const NAV_SECONDARY_MANAGER = [["team", "Equipo"]] as const;

const NAV_SECONDARY_ADMIN = [
  ["rewards", "Recompensas"],
  ["locations", "Sedes"],
  ["audit", "Auditoría"],
  ["settings", "Config"],
] as const;

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: m } = await supabase
      .from("organization_members")
      .select("role, organizations!inner(slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("organizations.slug", org)
      .maybeSingle();
    role = m?.role ?? null;
  }

  const isManager = role === "manager" || role === "admin" || role === "owner";
  const isAdmin = role === "admin" || role === "owner";

  const nav = [...NAV_BASE, ...(isAdmin ? NAV_ADMIN_PRIMARY : [])];
  const secondary = [
    ...NAV_SECONDARY_BASE,
    ...(isManager ? NAV_SECONDARY_MANAGER : []),
    ...(isAdmin ? NAV_SECONDARY_ADMIN : []),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <OrgNav base={`/dashboard/${org}`} items={nav} secondary={secondary} />
      {children}
    </div>
  );
}
