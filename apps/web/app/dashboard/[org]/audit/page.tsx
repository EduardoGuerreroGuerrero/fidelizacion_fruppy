import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

// Auditoría: la policy audit_select solo devuelve filas a owner/admin;
// para otros roles la lista sale vacía (no es error).
export default async function AuditPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, created_at, actor_user_id, action, entity_type, entity_id, metadata")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">Auditoría</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Acciones sensibles registradas. Visible solo para owner/admin.
      </p>
      <ul className="space-y-2">
        {(logs ?? []).map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
          >
            <span className="font-medium">{l.action}</span>
            <span className="ml-2 text-neutral-500">
              {l.entity_type}
              {l.entity_id ? ` · ${String(l.entity_id).slice(0, 8)}…` : ""}
            </span>
            <span className="float-right text-xs text-neutral-400">
              {new Date(l.created_at).toLocaleString("es-CO")}
            </span>
          </li>
        ))}
        {(logs ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            Sin eventos registrados (o sin permiso de lectura).
          </li>
        )}
      </ul>
    </div>
  );
}
