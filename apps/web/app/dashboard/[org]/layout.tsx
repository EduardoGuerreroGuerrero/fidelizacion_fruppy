import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { OrgNav } from "./nav";
import { OrgLogo } from "../org-logo";
import { FruppyShell } from "./_fruppy/shell";
import { FRUPPY_SLUG, initials } from "./_fruppy/config";
import { displayName } from "@/lib/format";

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

const ROLE_LABEL: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  manager: "Gerente",
  staff: "Colaborador",
};

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
      .select("role, organizations!inner(slug, name, brand)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("organizations.slug", org)
      .maybeSingle();
    role = m?.role ?? null;
    const o = m?.organizations as
      | { name?: string; brand?: { logo_url?: string } }
      | { name?: string; brand?: { logo_url?: string } }[]
      | null;
    const orgRow = Array.isArray(o) ? o[0] : o;
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

  // UI de marca propia solo para Fruppy Helados (mockups "Panel admin-owner").
  if (org === FRUPPY_SLUG) {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const metaName = [meta.first_name, meta.last_name]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .join(" ");
    const userName = displayName(
      metaName || String(user?.email ?? "usuario").split("@")[0],
    );
    return (
      <FruppyShell
        base={`/dashboard/${org}`}
        orgName={orgName ?? org}
        userName={userName}
        roleLabel={ROLE_LABEL[role ?? ""] ?? "Equipo"}
        nav={nav}
        secondary={secondary}
        signOut={signOut}
      >
        {children}
      </FruppyShell>
    );
  }

  return (
    // Las vars --color-brand se sobreescriben a la paleta PineappleLoyalty
    // solo para el panel genérico: el shell Fruppy retorna antes y conserva
    // su teal de marca. Así los utilities bg/text-brand internos se ven PL.
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
