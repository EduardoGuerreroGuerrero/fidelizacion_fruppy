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

  const { count: customerCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .eq("status", "active");

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-neutral-500">
        <Link href="/dashboard" className="hover:underline">
          Organizaciones
        </Link>{" "}
        / {org.name}
      </p>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">{org.name}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/dashboard/${slug}/customers`}
          className="rounded-lg border border-neutral-200 p-5 hover:border-neutral-400 dark:border-neutral-800"
        >
          <p className="text-3xl font-semibold">{customerCount ?? 0}</p>
          <p className="mt-1 text-sm text-neutral-500">Clientes activos</p>
        </Link>
        <div className="rounded-lg border border-dashed border-neutral-300 p-5 text-sm text-neutral-400 dark:border-neutral-700">
          Programas, recompensas y QR — Fases 4–5 en el motor ya verificado, UI próximamente.
        </div>
      </div>
    </div>
  );
}
