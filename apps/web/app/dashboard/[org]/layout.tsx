import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

// Navegación por rol. La autorización real va server-side en cada página y
// en las policies/RPCs — ocultar opciones aquí es solo UX (defensa ya existe).
const NAV_BASE = [
  ["", "Inicio"],
  ["customers", "Clientes"],
  ["scan", "Escanear"],
  ["analytics", "Analítica"],
] as const;

const NAV_MANAGER = [["team", "Equipo"]] as const;

const NAV_ADMIN = [
  ["programs", "Programas"],
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

  const nav = [
    ...NAV_BASE,
    ...(role === "manager" || role === "admin" || role === "owner" ? NAV_MANAGER : []),
    ...(role === "admin" || role === "owner" ? NAV_ADMIN : []),
  ];

  return (
    <>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200 pb-3 text-sm dark:border-neutral-800">
        {nav.map(([path, label]) => (
          <Link
            key={path}
            href={`/dashboard/${org}${path ? `/${path}` : ""}`}
            className="rounded-md px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
