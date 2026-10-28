import { notFound, redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export const instant = false;

// Auditoría: la policy audit_select solo devuelve filas a owner/admin;
// para otros roles la lista sale vacía (no es error).
export default async function AuditPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
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
      <p className="mb-4 text-sm text-ink-soft">
        Acciones sensibles registradas. Visible solo para owner/admin.
      </p>
      <ul className="space-y-2">
        {(logs ?? []).map((l) => (
          <li
            key={l.id}
            className="flex flex-col gap-1 rounded-lg border border-neutral-200 px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3"
          >
            <p className="min-w-0 break-words">
              <span className="font-medium">{l.action}</span>
              <span className="ml-2 break-all text-ink-soft">
                {l.entity_type}
                {l.entity_id ? ` · ${String(l.entity_id).slice(0, 8)}…` : ""}
              </span>
            </p>
            <span className="shrink-0 text-xs text-ink-soft">
              {new Date(l.created_at).toLocaleString("es-CO")}
            </span>
          </li>
        ))}
        {(logs ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-ink-soft">
            Sin eventos registrados (o sin permiso de lectura).
          </li>
        )}
      </ul>
    </div>
  );
}
