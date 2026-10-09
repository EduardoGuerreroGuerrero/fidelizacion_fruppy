import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function OrgPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS: solo visible si el usuario es miembro activo.
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  // Server Component: un render por request, Date.now es determinista aquí.
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [
    { count: customerCount },
    { count: visits30d },
    { count: redemptionCount },
    { data: recentVisits },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("status", "active"),
    supabase
      .from("customer_visits")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("redemptions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("status", "completed"),
    supabase
      .from("customer_visits")
      .select("id, created_at, source, customers(first_name, last_name)")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const cards = [
    { label: "Clientes activos", value: customerCount ?? 0, href: `customers` },
    { label: "Visitas (30 días)", value: visits30d ?? 0, href: `customers` },
    { label: "Canjes completados", value: redemptionCount ?? 0, href: `rewards` },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">{org.name}</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={`/dashboard/${slug}/${c.href}`}
            className="rounded-lg border border-neutral-200 p-5 hover:border-neutral-400 dark:border-neutral-800"
          >
            <p className="text-3xl font-semibold tabular-nums">{c.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-medium">Actividad reciente</h2>
      <ul className="space-y-2">
        {(recentVisits ?? []).map((v) => {
          const c = Array.isArray(v.customers) ? v.customers[0] : v.customers;
          return (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
            >
              <span>
                Visita de {c?.first_name} {c?.last_name ?? ""}
              </span>
              <span className="text-xs text-neutral-500">
                {new Date(v.created_at).toLocaleString("es-CO")} · {v.source}
              </span>
            </li>
          );
        })}
        {(recentVisits ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            Sin actividad todavía. Escanea la primera tarjeta.
          </li>
        )}
      </ul>
    </div>
  );
}
