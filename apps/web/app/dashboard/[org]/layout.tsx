import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { OrgNav } from "./nav";
import { OrgLogo } from "../org-logo";
import { initials } from "@/lib/format";

export const instant = false;

// Navegación por rol. La autorización real va server-side en cada página y
// en las policies/RPCs — ocultar opciones aquí es solo UX (defensa ya existe).
// Menú principal: tareas frecuentes como enlaces directos; el resto agrupado
// por tema en menús desplegables (Programa / Marketing / Administración).
const NAV_BASE = [
  ["", "Inicio"],
  ["scan", "Registrar visita"],
  ["customers", "Clientes"],
] as const;

type Entry = readonly [path: string, label: string];
type Gated = { item: Entry; min: "all" | "manager" | "admin" };

const NAV_GROUPS: readonly { label: string; items: readonly Gated[] }[] = [
  {
    label: "Programa",
    items: [
      { item: ["programs", "Programa"], min: "admin" },
      { item: ["rewards", "Recompensas"], min: "admin" },
      { item: ["rights", "Derechos"], min: "manager" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { item: ["analytics", "Analítica"], min: "all" },
      { item: ["campaigns", "Campañas"], min: "manager" },
      { item: ["join", "QR registro"], min: "manager" },
    ],
  },
  {
    label: "Administración",
    items: [
      { item: ["team", "Equipo"], min: "manager" },
      { item: ["locations", "Sedes"], min: "admin" },
      { item: ["audit", "Auditoría"], min: "admin" },
      { item: ["settings", "Config"], min: "admin" },
    ],
  },
];


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

  const allowed = (min: Gated["min"]) =>
    min === "all" || (min === "manager" ? isManager : isAdmin);
  const groups = NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.filter((i) => allowed(i.min)).map((i) => i.item),
  })).filter((g) => g.items.length > 0);

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
      <OrgNav base={`/dashboard/${org}`} items={NAV_BASE} groups={groups} />
      {children}
    </div>
  );
}
