import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { OrgNav } from "./nav";
import { OrgLogo } from "../org-logo";
import { initials } from "@/lib/format";

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

const NAV_SECONDARY_MANAGER = [
  ["campaigns", "Campañas"],
  ["join", "QR registro"],
  ["rights", "Derechos"],
  ["team", "Equipo"],
] as const;

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
  let orgName: string | null = null;
  let logoUrl: string | null = null;
  if (user) {
    const { data: m } = await supabase
      .from("organization_members")
      .select("role, organizations!inner(slug, name, brand, status)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("organizations.slug", org)
      .maybeSingle();
    role = m?.role ?? null;
    const o = m?.organizations as
      | { name?: string; status?: string; brand?: { logo_url?: string } }
      | { name?: string; status?: string; brand?: { logo_url?: string } }[]
      | null;
    const orgRow = Array.isArray(o) ? o[0] : o;
    if (orgRow?.status === "closed") {
      redirect("/dashboard?error=" + encodeURIComponent("Esa organización está cerrada."));
    }
    orgName = orgRow?.name ?? null;
    const raw = orgRow?.brand?.logo_url;
    logoUrl =
      raw && (!raw.startsWith("data:") || raw.startsWith("data:image/png"))
        ? raw
        : null;
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
    // Las vars --color-brand se fijan a la paleta PineappleLoyalty en el panel
    // del comercio: así los utilities bg/text-brand-dark internos se ven PL.
    <div
      className="mx-auto max-w-5xl"
      style={
        {
          "--color-brand": "#0f5132",
          "--color-brand-dark": "#0b3d25",
          "--color-brand-soft": "#e2f5e9",
        } as React.CSSProperties
      }
    >
      {/* Marca de la organización seleccionada (logo subido o iniciales) */}
      <div className="mb-3 flex items-center gap-2.5 px-1">
        <OrgLogo src={logoUrl} className="h-9 w-auto shrink-0 object-contain">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pl-cream text-sm font-bold text-pl-green">
            {initials(orgName ?? org) || "?"}
          </span>
        </OrgLogo>
        <span className="font-semibold text-ink">{orgName ?? org}</span>
        <form action={signOut} className="ml-auto">
          <button
            type="submit"
            className="rounded-full bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/20"
          >
            Salir
          </button>
        </form>
      </div>
      <OrgNav base={`/dashboard/${org}`} items={nav} secondary={secondary} />
      {children}
    </div>
  );
}
