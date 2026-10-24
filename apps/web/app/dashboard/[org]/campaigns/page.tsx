import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pushConfigured } from "@/lib/push/send";
import {
  cancelPushCampaign,
  duplicatePushCampaign,
  queuePushCampaign,
  savePushCampaign,
} from "@/lib/admin/actions";
import { SubmitButton } from "@/app/_components/submit-button";
import { CampaignComposer } from "./composer";

export const instant = false;

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-neutral-100 text-ink-soft" },
  scheduled: { label: "Programada", cls: "bg-amber-100 text-amber-800" },
  sending: { label: "Enviando", cls: "bg-sky-100 text-sky-800" },
  sent: { label: "Enviada", cls: "bg-brand-soft text-brand" },
  cancelled: { label: "Cancelada", cls: "bg-red-50 text-red-700" },
};

const walletStats = (w: Record<string, number>) =>
  [
    `${w.notified ?? 0} con aviso`,
    w.textOnly ? `${w.textOnly} solo texto (cuota de Google)` : null,
    w.failed ? `${w.failed} con error` : null,
  ]
    .filter(Boolean)
    .join(" · ");

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

// Campañas del comercio (push en navegador + mensaje en Google Wallet). La
// audiencia la resuelve el servidor (misma regla que el envío): suscripción
// activa + consentimiento vigente + cliente activo — y solo de ESTE comercio.
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

  const lastSent = (campaigns ?? []).find((c) => c.status === "sent");
  const scheduledCount = (campaigns ?? []).filter((c) => c.status === "scheduled").length;
  const disabled = !pushEnabled || !configured;
  const aud = audience ?? 0;

  const summary: [string, string, string][] = [
    ["Audiencia elegible", String(aud), "suscripciones push"],
    ["Este mes", `${monthly}/${monthlyLimit}`, "campañas enviadas"],
    ["Programadas", String(scheduledCount), "pendientes"],
    ["Última enviada", lastSent?.sent_at ? when(lastSent.sent_at) : "—", lastSent?.title ?? "aún ninguna"],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Campañas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Avisos a tus clientes en su navegador y en Google Wallet.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {ok}
        </p>
      )}
      {!pushEnabled ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Las notificaciones push están desactivadas para este comercio (Configuración → Privacidad y funciones).
        </p>
      ) : !configured ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Push no está configurado en el servidor (faltan claves VAPID).
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map(([k, v, sub]) => (
          <div key={k} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm dark:bg-transparent">
            <dt className="text-xs text-ink-soft">{k}</dt>
            <dd className="mt-1 truncate text-lg font-semibold tabular-nums">{v}</dd>
            <p className="truncate text-[11px] text-ink-soft">{sub}</p>
          </div>
        ))}
      </dl>

      {aud === 0 && pushEnabled ? (
        <p className="rounded-xl border border-dashed border-ink/15 px-4 py-3 text-sm text-ink-soft">
          Aún nadie activó las notificaciones. Tus clientes lo hacen desde su tarjeta → Perfil → Notificaciones.
          Los pases de Google Wallet también reciben el mensaje.
        </p>
      ) : null}
      {aud > 500 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Audiencia grande: el envío se procesa por lotes; verifica el texto antes de enviar.
        </p>
      ) : null}

      <section aria-labelledby="nueva">
        <h2 id="nueva" className="mb-3 font-semibold">Nueva campaña</h2>
        <CampaignComposer
          action={savePushCampaign.bind(null, slug)}
          orgName={org.name}
          orgInitial={org.name.slice(0, 1).toUpperCase()}
          disabled={disabled}
          audience={aud}
        />
      </section>

      <section aria-labelledby="historial">
        <h2 id="historial" className="mb-3 font-semibold">Historial</h2>
        <ul className="space-y-2">
          {(campaigns ?? []).map((c) => {
            const stats = (c.stats ?? {}) as Record<string, number>;
            const wallet = (c.stats as { wallet?: Record<string, number> } | null)?.wallet;
            const st = STATUS[c.status] ?? { label: c.status, cls: "bg-neutral-100 text-ink-soft" };
            const total =
              (stats.sent ?? 0) + (stats.failed ?? 0) + (stats.expired ?? 0) + (stats.skipped ?? 0);
            const pct = total > 0 ? Math.round(((stats.sent ?? 0) / total) * 100) : 0;
            return (
              <li key={c.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm dark:bg-transparent">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{c.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-0.5 break-words text-sm text-ink-soft">{c.body}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {c.status === "scheduled" && c.scheduled_at
                        ? `Para ${when(c.scheduled_at)}`
                        : c.sent_at
                          ? `Enviada ${when(c.sent_at)}`
                          : `Creada ${when(c.created_at)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {(c.status === "draft" || c.status === "scheduled") && (
                      <form action={queuePushCampaign.bind(null, slug, c.id)}>
                        <SubmitButton
                          disabled={disabled}
                          className="rounded-full bg-brand-dark px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          confirm="¿Enviar la campaña ahora a todos los clientes suscritos? No se puede deshacer.">
                          Enviar ahora
                        </SubmitButton>
                      </form>
                    )}
                    <form action={duplicatePushCampaign.bind(null, slug, c.id)}>
                      <SubmitButton className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs hover:bg-neutral-50">
                        Duplicar
                      </SubmitButton>
                    </form>
                    {(c.status === "draft" || c.status === "scheduled" || c.status === "sending") && (
                      <form action={cancelPushCampaign.bind(null, slug, c.id)}>
                        <SubmitButton
                          className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs hover:bg-neutral-50"
                          confirm="¿Seguro que quieres cancelar?">
                          Cancelar
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
                {c.status === "sent" && wallet ? (
                  <p className="mt-2 text-xs text-ink-soft">
                    Wallet: {walletStats(wallet)}
                  </p>
                ) : null}
                {c.status === "sent" && total > 0 ? (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
                      <div className="h-full rounded-full bg-pl-green-2" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">
                      {stats.sent ?? 0} entregadas ({pct}%)
                      {stats.skipped ? ` · ${stats.skipped} omitidas` : ""}
                      {stats.failed ? ` · ${stats.failed} fallidas` : ""}
                      {stats.expired ? ` · ${stats.expired} expiradas` : ""}
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
          {(campaigns ?? []).length === 0 && (
            <li className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink-soft">
              Aún no hay campañas.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
