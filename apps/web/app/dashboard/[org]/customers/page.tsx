import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { org: slug } = await params;
  const { q = "", status = "active" } = await searchParams;
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
    .select("id, first_name, last_name, email, phone, status, marketing_consent_at, created_at")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status === "active" || status === "inactive") query = query.eq("status", status);

  const needle = escapeIlike(q.trim());
  if (needle) {
    query = query.or(
      `first_name.ilike.%${needle}%,last_name.ilike.%${needle}%,` +
        `email.ilike.%${needle}%,phone.ilike.%${needle}%`,
    );
  }

  const { data: customers } = await query;

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
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <div>
                  <p className="font-medium">
                    {c.first_name} {c.last_name ?? ""}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
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
