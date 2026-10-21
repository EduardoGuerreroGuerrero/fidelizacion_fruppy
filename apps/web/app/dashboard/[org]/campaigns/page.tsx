import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pushConfigured } from "@/lib/push/send";
import {
  cancelPushCampaign,
  queuePushCampaign,
  savePushCampaign,
} from "@/lib/admin/actions";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";

export const instant = false;

const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  sending: "Enviando",
  sent: "Enviada",
  cancelled: "Cancelada",
};

// Campañas push del comercio. La audiencia la resuelve el servidor (misma
// regla que el envío): suscripción activa + consentimiento vigente +
// cliente activo — y solo de ESTE comercio.
export default async function CampaignsPage({
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
    .select("id, name, features, limits")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const features = (org.features ?? {}) as Record<string, unknown>;
  const limits = (org.limits ?? {}) as Record<string, unknown>;
  const pushEnabled = features.push === true;
  const configured = pushConfigured();

  const [{ data: campaigns }, { data: audience }] = await Promise.all([
    supabase
      .from("push_campaigns")
      .select("id, title, body, url, status, scheduled_at, sent_at, stats, created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(50),
    pushEnabled
      ? supabase.rpc("push_audience_count", { p_org_id: org.id })
      : Promise.resolve({ data: 0 as number }),
  ]);

  const monthly = (campaigns ?? []).filter(
    (c) =>
      (c.status === "sending" || c.status === "sent") &&
      new Date(c.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  ).length;
  const monthlyLimit = typeof limits.push_campaigns_per_month === "number"
    ? limits.push_campaigns_per_month
    : 30;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Campañas push</h1>

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

      {!pushEnabled ? (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Las notificaciones push están desactivadas para este comercio
          (Configuración → Privacidad y funciones).
        </p>
      ) : !configured ? (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Push no está configurado en el servidor (faltan claves VAPID).
        </p>
      ) : null}

      <section className="mb-6 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Nueva campaña</h2>
          <p className="text-xs text-ink-soft">
            Audiencia elegible: <strong>{audience ?? 0}</strong> suscripciones ·{" "}
            {monthly}/{monthlyLimit} este mes
          </p>
        </div>
        {(audience ?? 0) > 500 ? (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Audiencia grande: el envío se procesa por lotes; verifica el texto
            antes de enviar.
          </p>
        ) : null}
        <RememberForm storageKey="campaign-new" action={savePushCampaign.bind(null, slug)} className="mt-3 space-y-3">
          <input
            name="title"
            required
            maxLength={100}
            placeholder="Título (ej. Hoy 2×1 en helados)"
            className={input}
          />
          <textarea
            name="body"
            required
            maxLength={300}
            rows={3}
            placeholder="Mensaje (máx. 300 caracteres)"
            className={input}
          />
          <input
            name="url"
            placeholder="Enlace interno (ej. /promociones) u https://"
            className={input}
          />
          <div>
            <label htmlFor="schedule" className="mb-1 block text-xs text-ink-soft">
              Programar para (opcional, hora local)
            </label>
            <input
              id="schedule"
              name="schedule"
              type="datetime-local"
              className={input}
            />
          </div>
          <SubmitButton
            disabled={!pushEnabled || !configured}
            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper disabled:opacity-50">
            Crear campaña
          </SubmitButton>
        </RememberForm>
        <p className="mt-2 text-xs text-ink-soft">
          Solo llega a clientes que activaron las notificaciones de {org.name}.
          Quien las desactive antes del envío no la recibe.
        </p>
      </section>

      <ul className="space-y-2">
        {(campaigns ?? []).map((c) => {
          const stats = (c.stats ?? {}) as Record<string, number>;
          return (
            <li
              key={c.id}
              className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{c.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{c.body}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {STATUS_LABEL[c.status] ?? c.status}
                    {c.scheduled_at && c.status === "scheduled"
                      ? ` · ${new Date(c.scheduled_at).toLocaleString("es-CO")}`
                      : ""}
                    {c.status === "sent" && stats.sent != null
                      ? ` · ${stats.sent} enviadas${stats.skipped ? `, ${stats.skipped} omitidas` : ""}${stats.failed ? `, ${stats.failed} fallidas` : ""}${stats.expired ? `, ${stats.expired} expiradas` : ""}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {(c.status === "draft" || c.status === "scheduled") && (
                    <form action={queuePushCampaign.bind(null, slug, c.id)}>
                      <SubmitButton
                        className="rounded-md bg-brand-dark px-3 py-1 text-xs font-semibold text-white"
                        confirm="¿Enviar la campaña ahora a todos los clientes suscritos? No se puede deshacer.">
                        Enviar ahora
                      </SubmitButton>
                    </form>
                  )}
                  {(c.status === "draft" ||
                    c.status === "scheduled" ||
                    c.status === "sending") && (
                    <form action={cancelPushCampaign.bind(null, slug, c.id)}>
                      <SubmitButton
                        className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        confirm="¿Seguro que quieres cancelar?">
                        Cancelar
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {(campaigns ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-ink-soft dark:border-neutral-700">
            Aún no hay campañas.
          </li>
        )}
      </ul>
    </div>
  );
}
