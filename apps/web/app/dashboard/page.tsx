import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // RLS: solo devuelve membresías/orgs del usuario autenticado.
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, status, organizations(id, name, slug, status)")
    .eq("status", "active");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis organizaciones</h1>
        <Link
          href="/dashboard/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Nueva organización
        </Link>
      </div>

      {memberships && memberships.length > 0 ? (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {memberships.map((m) => {
            const org = Array.isArray(m.organizations)
              ? m.organizations[0]
              : m.organizations;
            if (!org) return null;
            return (
              <li
                key={org.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-neutral-500">
                    {org.slug} · {org.status}
                  </p>
                </div>
                <span className="rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">
                  {m.role}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          Aún no tienes organizaciones. Crea la primera para empezar tu programa
          de fidelización.
        </p>
      )}
    </div>
  );
}
