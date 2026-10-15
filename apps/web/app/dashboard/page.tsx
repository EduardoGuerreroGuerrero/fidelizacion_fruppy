import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  IconChevron,
  IconPlus,
  IconStore,
} from "@/app/t/[token]/_components/icons";
import { initials, FRUPPY_SLUG } from "./[org]/_fruppy/config";
import { OrgLogo } from "./org-logo";

const STATUS_BADGE: Record<string, { label: string; chip: string; dot: string }> =
  {
    active: {
      label: "Activa",
      chip: "bg-chip-green text-chip-green-ink",
      dot: "bg-chip-green-ink",
    },
    trial: {
      label: "Prueba",
      chip: "bg-pl-cream text-[#b45309]",
      dot: "bg-pl-yellow",
    },
    suspended: {
      label: "Suspendida",
      chip: "bg-accent-soft text-accent",
      dot: "bg-accent",
    },
  };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS permite ver a TODOS los miembros de mis orgs — hay que filtrar por
  // user_id o cada tarjeta se repite por cada miembro de la organización.
  const { data: memberships } = user
    ? await supabase
        .from("organization_members")
        .select("role, status, organizations(id, name, slug, status, brand)")
        .eq("user_id", user.id)
        .eq("status", "active")
    : { data: [] };

  return (
    <div className="relative mx-auto max-w-2xl">
      {/* Isotipo PineappleLoyalty decorativo de fondo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pineapple/isotipo.png"
        alt=""
        aria-hidden
        className="pointer-events-none fixed -bottom-28 -left-28 w-[440px] select-none opacity-[0.07]"
      />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Mis organizaciones
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Administra tus negocios y programas de fidelización desde un solo
            lugar.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="flex shrink-0 items-center gap-2 rounded-full bg-pl-green-2 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pl-green"
        >
          <IconPlus className="size-4" />
          Nueva organización
        </Link>
      </div>

      {memberships && memberships.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {memberships.map((m) => {
            const org = Array.isArray(m.organizations)
              ? m.organizations[0]
              : m.organizations;
            if (!org) return null;
            const brand = (org.brand ?? {}) as {
              color?: string;
              logo_url?: string;
            };
            // brand.logo_url puede contener assets de Wallet (SVG en data
            // URI), no el logo del comercio: se aceptan URLs y PNGs subidos
            // (data:image/png); para Fruppy el logo de /brand (convención ya
            // usada por el shell del panel).
            const servable =
              brand.logo_url &&
              (!brand.logo_url.startsWith("data:") ||
                brand.logo_url.startsWith("data:image/png"));
            const logoUrl = servable
              ? brand.logo_url!
              : org.slug === FRUPPY_SLUG
                ? "/brand/logo-sm.png"
                : null;
            const badge = STATUS_BADGE[org.status] ?? STATUS_BADGE.active;
            return (
              <li key={org.id}>
                <Link
                  href={`/dashboard/${org.slug}`}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] transition hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/pineapple/isotipo.png"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -bottom-12 w-36 select-none opacity-[0.10]"
                  />
                  <span
                    className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold ${
                      brand.color ? "" : "bg-pl-cream text-pl-green"
                    }`}
                    style={
                      brand.color
                        ? { backgroundColor: `${brand.color}1f`, color: brand.color }
                        : undefined
                    }
                  >
                    <OrgLogo
                      src={logoUrl}
                      className="size-full object-contain p-1.5"
                    >
                      {initials(org.name) || "?"}
                    </OrgLogo>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-ink">
                      {org.name}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.chip}`}
                    >
                      <span className={`size-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200 transition group-hover:bg-pl-cream">
                    <IconChevron className="size-4 text-ink" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-10 text-center">
          <IconStore className="mx-auto size-8 text-ink-soft" />
          <p className="mt-3 text-sm text-ink-soft">
            Aún no tienes organizaciones. Crea la primera para empezar tu
            programa de fidelización.
          </p>
        </div>
      )}
    </div>
  );
}
