import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { OrgNav } from "./nav";
import { FruppyShell } from "./_fruppy/shell";
import { FRUPPY_SLUG } from "./_fruppy/config";
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
  if (user) {
    const { data: m } = await supabase
      .from("organization_members")
      .select("role, organizations!inner(slug, name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("organizations.slug", org)
      .maybeSingle();
    role = m?.role ?? null;
    const o = m?.organizations as { name?: string } | { name?: string }[] | null;
    orgName = (Array.isArray(o) ? o[0]?.name : o?.name) ?? null;
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
    <div className="mx-auto max-w-5xl">
      {/* Marca de la organización seleccionada (logo + nombre registrado) */}
      <div className="mb-3 flex items-center gap-2.5 px-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-sm.png" alt="" className="h-9 w-auto shrink-0 object-contain" />
        <span className="font-semibold text-ink">{orgName ?? org}</span>
      </div>
      <OrgNav base={`/dashboard/${org}`} items={nav} secondary={secondary} />
      {children}
    </div>
  );
}
