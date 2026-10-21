import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/format";
import { ImportCsvButton } from "../_components/import-csv";
import { statusLabel } from "@/lib/labels";

export const instant = false;

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
    consent?: string;
  }>;
}) {
  const { org: slug } = await params;
  const { q = "", status = "active", consent = "" } = await searchParams;

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

  let query = supabase
    .from("customers")
    .select(
      "id, first_name, last_name, email, phone, status, marketing_consent_at, push_consent_state, created_at",
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  if (status === "active" || status === "inactive") query = query.eq("status", status);

  // Filtro por canal autorizado: marketing por correo o push del comercio.
  if (consent === "marketing") query = query.not("marketing_consent_at", "is", null);
  else if (consent === "push") query = query.eq("push_consent_state", "granted");

  const needle = escapeIlike(q.trim());
  if (needle) {
    query = query.or(
      `first_name.ilike.%${needle}%,last_name.ilike.%${needle}%,` +
        `email.ilike.%${needle}%,phone.ilike.%${needle}%`,
    );
  }

  const { data: customers } = await query.limit(100);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm text-ink-soft">
        <Link href={`/dashboard/${slug}`} className="hover:underline">
          {org.name}
        </Link>{" "}
        / Clientes
      </p>
      <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ImportCsvButton slug={slug} />
          <a
            href={`/dashboard/${slug}/customers/export`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Exportar CSV
          </a>
          <Link
            href={`/dashboard/${slug}/customers/new`}
            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper"
          >
            Nuevo cliente
          </Link>
        </div>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" action="">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, email o teléfono…"
          className="min-w-[12rem] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
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
        <select
          name="consent"
          defaultValue={consent}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
        >
          <option value="">Todos los canales</option>
          <option value="marketing">Con marketing</option>
          <option value="push">Con push</option>
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
                  <p className="break-all text-sm text-ink-soft">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-xs">
                  {c.marketing_consent_at && (
                    <span className="rounded bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      marketing
                    </span>
                  )}
                  {c.push_consent_state === "granted" && (
                    <span className="rounded bg-sky-100 px-2 py-1 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                      push
                    </span>
                  )}
                  <span
                    className={`rounded px-2 py-1 ${
                      c.status === "active"
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {statusLabel(c.status)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-ink-soft dark:border-neutral-700">
          {needle
            ? "Sin resultados para esa búsqueda."
            : "Aún no hay clientes. Registra el primero."}
        </p>
      )}
    </div>
  );
}
