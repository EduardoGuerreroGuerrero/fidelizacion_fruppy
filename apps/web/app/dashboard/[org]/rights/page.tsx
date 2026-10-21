import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateRightsRequest } from "@/lib/admin/actions";
import { rightsDeadline } from "@/lib/legal/deadlines";

export const instant = false;

// Fuera del render: la regla de pureza de React no admite Date.now() ahí.
function isPast(d: Date): boolean {
  return d.getTime() < Date.now();
}

const TYPE_LABEL: Record<string, string> = {
  access: "Acceso / conocer datos",
  rectification: "Rectificación",
  erasure: "Supresión",
  revocation: "Revocación de autorización",
  complaint: "Reclamo",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Abierta",
  in_progress: "En trámite",
  resolved: "Resuelta",
  rejected: "Rechazada",
};

// Solicitudes de derechos de los titulares (Ley 1581): el cliente las envía
// desde su tarjeta; el equipo las gestiona aquí. Plazos (Ley 1581): consultas
// 10 días hábiles (art. 14), reclamos 15 días hábiles (art. 15).
export default async function RightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { org: slug } = await params;
  const { error, ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, legal")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const { data: requests } = await supabase
    .from("data_rights_requests")
    .select(
      "id, request_type, detail, status, created_at, response, resolved_at, customers(first_name, email)",
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const legal = (org.legal ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Derechos de los titulares</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {ok}
        </p>
      )}

      <p className="mb-4 rounded-md bg-neutral-50 px-4 py-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
        Plazo legal de respuesta (Ley 1581): 10 días hábiles para consultas
        (acceso a datos) y 15 días hábiles para reclamos (corrección, supresión,
        retiro de autorización, queja). Canal de privacidad configurado:{" "}
        {legal.privacy_email ?? "— define uno en Configuración"}.
      </p>

      <ul className="space-y-2">
        {(requests ?? []).map((r) => {
          const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
          const closed = r.status === "resolved" || r.status === "rejected";
          const { days, due } = rightsDeadline(r.request_type, new Date(r.created_at));
          const overdue = !closed && isPast(due);
          const destructive = r.request_type === "erasure" || r.request_type === "revocation";
          return (
            <li
              key={r.id}
              className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {TYPE_LABEL[r.request_type] ?? r.request_type}
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-ink-soft dark:bg-neutral-800">
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {cust?.first_name ?? "—"} {cust?.email ? `· ${cust.email}` : ""}
                  </p>
                  {r.detail ? (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {r.detail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-ink-soft">
                    {new Date(r.created_at).toLocaleString("es-CO")}
                    {!closed ? (
                      <span className={overdue ? "ml-2 font-semibold text-red-600" : "ml-2"}>
                        · {overdue ? "Vencida el" : "Responder antes del"}{" "}
                        {due.toLocaleDateString("es-CO", { timeZone: "UTC" })} ({days} días
                        hábiles)
                      </span>
                    ) : null}
                  </p>
                  {closed && r.response ? (
                    <p className="mt-2 rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                      <span className="font-medium">Respuesta:</span> {r.response}
                    </p>
                  ) : null}
                </div>
                {!closed ? (
                  <form
                    action={updateRightsRequest.bind(null, slug, r.id)}
                    className="flex w-56 shrink-0 flex-col gap-1.5"
                  >
                    <textarea
                      name="response"
                      rows={3}
                      placeholder="Respuesta al titular (obligatoria al resolver o rechazar)"
                      className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-transparent"
                    />
                    <button
                      type="submit"
                      name="status"
                      value="resolved"
                      className="w-full rounded-md bg-brand-dark px-3 py-1 text-xs font-semibold text-white"
                    >
                      {destructive ? "Resolver y ejecutar" : "Resolver"}
                    </button>
                    {destructive ? (
                      <p className="text-[11px] leading-snug text-ink-soft">
                        {r.request_type === "erasure"
                          ? "Elimina los datos personales del titular y cierra su tarjeta. El historial de sellos se conserva sin datos personales."
                          : "Retira todas sus autorizaciones y cierra su tarjeta."}{" "}
                        Solo owner/admin.
                      </p>
                    ) : null}
                    {r.status === "open" ? (
                      <button
                        type="submit"
                        name="status"
                        value="in_progress"
                        formNoValidate
                        className="w-full rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        Marcar en trámite
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      name="status"
                      value="rejected"
                      className="w-full rounded-md border border-neutral-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-900/20"
                    >
                      Rechazar
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          );
        })}
        {(requests ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-ink-soft dark:border-neutral-700">
            Sin solicitudes de derechos.
          </li>
        )}
      </ul>
    </div>
  );
}
