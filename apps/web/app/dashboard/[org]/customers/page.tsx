import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/format";
import { FruppyCustomers, type CustomerRow, type PanelData } from "../_fruppy/customers";
import { PageHead } from "../_fruppy/ui";
import { FRUPPY_SLUG } from "../_fruppy/config";

export const instant = false;

const PAGE_SIZE = 8;

// Escape de caracteres con significado en patrones ilike de PostgREST.
function escapeIlike(q: string): string {
  return q.replace(/[%_\\]/g, (c) => `\\${c}`);
}

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    program?: string;
    page?: string;
    panel?: string;
  }>;
}) {
  const { org: slug } = await params;
  const {
    q = "",
    status = "active",
    program = "",
    page: pageParam = "1",
    panel = "",
  } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const fruppy = slug === FRUPPY_SLUG;

  let query = supabase
    .from("customers")
    .select(
      "id, first_name, last_name, email, phone, status, marketing_consent_at, created_at",
      fruppy ? { count: "exact" } : undefined,
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  if (status === "active" || status === "inactive") query = query.eq("status", status);

  const needle = escapeIlike(q.trim());
  if (needle) {
    query = query.or(
      `first_name.ilike.%${needle}%,last_name.ilike.%${needle}%,` +
        `email.ilike.%${needle}%,phone.ilike.%${needle}%`,
    );
  }

  // En la variante Fruppy el filtro por programa se aplica vía las cuentas:
  // solo clientes con cuenta en ese programa.
  let programs: { id: string; name: string }[] = [];
  const accountByCustomer = new Map<
    string,
    {
      programName: string | null;
      programType: string | null;
      stamps: number;
      stampGoal: number | null;
      points: number;
    }
  >();

  if (fruppy) {
    const [{ data: progs }, { data: accounts }] = await Promise.all([
      supabase
        .from("loyalty_programs")
        .select("id, name")
        .eq("organization_id", org.id)
        .neq("status", "archived")
        .order("created_at"),
      supabase
        .from("loyalty_accounts")
        .select(
          `customer_id, program_id, current_stamps, current_points, loyalty_programs(name, program_type, stamp_goal)`,
        )
        .eq("organization_id", org.id)
        .limit(2000),
    ]);
    programs = progs ?? [];

    for (const a of accounts ?? []) {
      const p = Array.isArray(a.loyalty_programs)
        ? a.loyalty_programs[0]
        : a.loyalty_programs;
      // La primera cuenta encontrada es la "principal" del cliente en la lista.
      if (!accountByCustomer.has(a.customer_id)) {
        accountByCustomer.set(a.customer_id, {
          programName: p?.name ?? null,
          programType: p?.program_type ?? null,
          stamps: a.current_stamps ?? 0,
          stampGoal: p?.stamp_goal ?? null,
          points: a.current_points ?? 0,
        });
      }
    }

    if (program) {
      const ids = (accounts ?? [])
        .filter((a) => a.program_id === program)
        .map((a) => a.customer_id);
      query = ids.length > 0 ? query.in("id", ids) : query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data: customers, count } = fruppy
    ? await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    : await query.limit(100);

  if (!fruppy) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-neutral-500">
          <Link href={`/dashboard/${slug}`} className="hover:underline">
            {org.name}
          </Link>{" "}
          / Clientes
        </p>
        <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <div className="flex gap-2">
            <a
              href={`/dashboard/${slug}/customers/export`}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Exportar CSV
            </a>
            <Link
              href={`/dashboard/${slug}/customers/new`}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              Nuevo cliente
            </Link>
          </div>
        </div>

        <form className="mb-4 flex gap-2" action="">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, email o teléfono…"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
          >
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos</option>
          </select>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Buscar
          </button>
        </form>

        {customers && customers.length > 0 ? (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/${slug}/customers/${c.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {displayName(`${c.first_name} ${c.last_name ?? ""}`)}
                    </p>
                    <p className="break-all text-sm text-neutral-500">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-xs">
                    {c.marketing_consent_at && (
                      <span className="rounded bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        marketing
                      </span>
                    )}
                    <span
                      className={`rounded px-2 py-1 ${
                        c.status === "active"
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
            {needle
              ? "Sin resultados para esa búsqueda."
              : "Aún no hay clientes. Registra el primero."}
          </p>
        )}
      </div>
    );
  }

  // ===== Variante Fruppy: enriquecer filas con programa/sellos/última visita =====
  const pageCustomers = customers ?? [];
  const ids = pageCustomers.map((c) => c.id);

  const lastVisitByCustomer = new Map<string, string>();
  if (ids.length > 0) {
    const { data: visits } = await supabase
      .from("customer_visits")
      .select("customer_id, created_at")
      .eq("organization_id", org.id)
      .in("customer_id", ids)
      .order("created_at", { ascending: false })
      .limit(400);
    for (const v of visits ?? []) {
      if (!lastVisitByCustomer.has(v.customer_id)) {
        lastVisitByCustomer.set(v.customer_id, v.created_at);
      }
    }
  }

  const rows: CustomerRow[] = pageCustomers.map((c) => {
    const acct = accountByCustomer.get(c.id);
    return {
      id: c.id,
      name: `${c.first_name} ${c.last_name ?? ""}`.trim(),
      email: c.email,
      phone: c.phone,
      status: c.status,
      marketing: Boolean(c.marketing_consent_at),
      programName: acct?.programName ?? null,
      programType: acct?.programType ?? null,
      stamps: acct?.stamps ?? 0,
      stampGoal: acct?.stampGoal ?? null,
      points: acct?.points ?? 0,
      lastVisitAt: lastVisitByCustomer.get(c.id) ?? null,
    };
  });

  // Panel lateral de detalle rápido (?panel=<id>): el cliente puede no estar
  // en la página actual de la tabla, así que se resuelve por separado.
  let panelData: PanelData = null;
  if (panel) {
    let row = rows.find((r) => r.id === panel);
    if (!row) {
      const { data: pc } = await supabase
        .from("customers")
        .select("id, first_name, last_name, email, phone, status, marketing_consent_at")
        .eq("id", panel)
        .eq("organization_id", org.id)
        .maybeSingle();
      if (pc) {
        const acct = accountByCustomer.get(pc.id);
        row = {
          id: pc.id,
          name: `${pc.first_name} ${pc.last_name ?? ""}`.trim(),
          email: pc.email,
          phone: pc.phone,
          status: pc.status,
          marketing: Boolean(pc.marketing_consent_at),
          programName: acct?.programName ?? null,
          programType: acct?.programType ?? null,
          stamps: acct?.stamps ?? 0,
          stampGoal: acct?.stampGoal ?? null,
          points: acct?.points ?? 0,
          lastVisitAt: lastVisitByCustomer.get(pc.id) ?? null,
        };
      }
    }
    if (row) {
      const [{ count: totalVisits }, { count: totalRedemptions }, { data: recentV }] =
        await Promise.all([
          supabase
            .from("customer_visits")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id)
            .eq("customer_id", panel),
          supabase
            .from("redemptions")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id)
            .eq("customer_id", panel),
          supabase
            .from("customer_visits")
            .select("id, created_at")
            .eq("organization_id", org.id)
            .eq("customer_id", panel)
            .order("created_at", { ascending: false })
            .limit(4),
        ]);
      panelData = {
        customer: row,
        totalVisits: totalVisits ?? 0,
        totalRedemptions: totalRedemptions ?? 0,
        recent: (recentV ?? []).map((v) => ({
          id: v.id,
          at: v.created_at,
          label: "Visita registrada",
        })),
      };
    }
  }

  return (
    <div>
      <PageHead
        orgName={org.name}
        base={`/dashboard/${slug}`}
        current="Clientes"
        title="Clientes"
        subtitle="Administra tu base de clientes y su progreso en el programa de fidelización"
        art="/brand/scan-photo.jpg"
      />
      <FruppyCustomers
        slug={slug}
        customers={rows}
        programs={programs}
        total={count ?? pageCustomers.length}
        page={page}
        pageSize={PAGE_SIZE}
        q={q}
        status={status}
        program={program}
        panel={panelData}
      />
    </div>
  );
}
