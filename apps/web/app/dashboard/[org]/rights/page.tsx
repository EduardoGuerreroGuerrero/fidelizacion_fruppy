import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateRightsRequest } from "@/lib/admin/actions";

export const instant = false;

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
// desde su tarjeta; el equipo las gestiona aquí. El plazo legal de
// respuesta en Colombia es de hasta 15 días hábiles.
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
    .select("id, request_type, detail, status, created_at, customers(first_name, email)")
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
        Plazo legal de respuesta: 15 días hábiles (consultas) / 10 días hábiles
        (reclamos). Canal de privacidad configurado:{" "}
        {legal.privacy_email ?? "— define uno en Configuración"}.
      </p>

      <ul className="space-y-2">
        {(requests ?? []).map((r) => {
          const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
          return (
            <li
              key={r.id}
              className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {TYPE_LABEL[r.request_type] ?? r.request_type}
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {cust?.first_name ?? "—"} {cust?.email ? `· ${cust.email}` : ""}
                  </p>
                  {r.detail ? (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {r.detail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(r.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
                {r.status === "open" ? (
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <form action={updateRightsRequest.bind(null, slug, r.id, "resolved")}>
                      <button
                        type="submit"
                        className="w-full rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white"
                      >
                        Resolver
                      </button>
                    </form>
                    <form action={updateRightsRequest.bind(null, slug, r.id, "in_progress")}>
                      <button
                        type="submit"
                        className="w-full rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        En trámite
                      </button>
                    </form>
                    <form action={updateRightsRequest.bind(null, slug, r.id, "rejected")}>
                      <button
                        type="submit"
                        className="w-full rounded-md border border-neutral-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-900/20"
                      >
                        Rechazar
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
        {(requests ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            Sin solicitudes de derechos.
          </li>
        )}
      </ul>
    </div>
  );
}
