import webpush from "web-push";
import { optionalEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { pushCampaignToWallets } from "@/lib/wallet/push";
import { resolveCampaignUrl } from "./destination";
import { renderCampaignText } from "./template";

// Envío Web Push por comercio. Solo servidor: la clave privada VAPID nunca
// sale del entorno. La elegibilidad se re-evalúa en el momento del envío:
// una baja de consentimiento o de suscripción ANTES del envío detiene la
// entrega aunque ya estuviera en cola.

let vapidReady = false;

export function pushConfigured(): boolean {
  if (optionalEnv("PUSH_ENABLED") === "false") return false;
  return !!(optionalEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY") && optionalEnv("VAPID_PRIVATE_KEY"));
}

function vapid() {
  if (vapidReady) return;
  const pub = optionalEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const priv = optionalEnv("VAPID_PRIVATE_KEY");
  if (!pub || !priv) throw new Error("vapid_not_configured");
  webpush.setVapidDetails(
    optionalEnv("VAPID_SUBJECT") ?? "mailto:admin@localhost",
    pub,
    priv,
  );
  vapidReady = true;
}

type QueuedDelivery = {
  id: number;
  campaign_id: string;
  attempts: number;
  push_subscriptions: {
    id: string;
    customer_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    status: string;
    customers: CustRow | CustRow[] | null;
  } | null;
  organization_id: string;
};

type CustRow = { status: string; push_consent_state: string | null; first_name: string | null };

type CampaignRow = { id: string; status: string; title: string; body: string; url: string | null };

// Encola las entregas de una campaña programada cuya hora ya llegó.
// Misma regla de elegibilidad que queue_push_campaign (audience de SU org).
async function queueDueCampaigns(admin: ReturnType<typeof supabaseAdmin>): Promise<number> {
  const { data: due } = await admin
    .from("push_campaigns")
    .select("id, organization_id, title, body")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .limit(5);

  for (const c of due ?? []) {
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, customers!inner(status, push_consent_state)")
      .eq("organization_id", c.organization_id)
      .eq("status", "active");
    const eligible = (subs ?? []).filter((s) => {
      const cust = Array.isArray(s.customers) ? s.customers[0] : s.customers;
      return cust?.status === "active" && cust?.push_consent_state === "granted";
    });
    if (eligible.length > 0) {
      await admin.from("push_deliveries").upsert(
        eligible.map((s) => ({
          organization_id: c.organization_id,
          campaign_id: c.id,
          subscription_id: s.id,
          status: "queued",
        })),
        { onConflict: "campaign_id,subscription_id", ignoreDuplicates: true },
      );
    }
    await admin
      .from("push_campaigns")
      .update({ status: "sending" })
      .eq("id", c.id)
      .eq("status", "scheduled");

    // Mismo mensaje hacia los pases Google entregados (con cuota 3/24h;
    // degradado a TEXT al agotarse). Best-effort: no bloquea el drenaje.
    const wallet = await pushCampaignToWallets(c.organization_id, c.title, c.body).catch((e) => {
      console.error("[push] wallet campaign failed:", e instanceof Error ? e.message : e);
      return null;
    });
    if (wallet) await saveWalletStats(admin, c.id, wallet);
  }
  return due?.length ?? 0;
}

// Guarda el resultado de wallet dentro de push_campaigns.stats.wallet (jsonb,
// sin migración) para mostrarlo en el historial.
export async function saveWalletStats(
  admin: ReturnType<typeof supabaseAdmin>,
  campaignId: string,
  wallet: Record<string, number>,
): Promise<void> {
  const { data: cur } = await admin.from("push_campaigns").select("stats").eq("id", campaignId).maybeSingle();
  const prev = (cur?.stats ?? {}) as Record<string, unknown>;
  await admin.from("push_campaigns").update({ stats: { ...prev, wallet } }).eq("id", campaignId);
}

async function finishCampaignIfDone(
  admin: ReturnType<typeof supabaseAdmin>,
  campaignId: string,
): Promise<void> {
  const { count: pending } = await admin
    .from("push_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "queued");
  if ((pending ?? 0) > 0) return;

  const { data: rows } = await admin
    .from("push_deliveries")
    .select("status")
    .eq("campaign_id", campaignId);
  const counts: Record<string, number> = { sent: 0, failed: 0, expired: 0, skipped: 0 };
  for (const r of rows ?? []) {
    if (r.status in counts) counts[r.status as keyof typeof counts] += 1;
  }
  // Conserva el resultado de wallet que ya hubiera guardado el envío.
  const { data: cur } = await admin.from("push_campaigns").select("stats").eq("id", campaignId).maybeSingle();
  const prev = (cur?.stats ?? {}) as Record<string, unknown>;
  const stats = prev.wallet ? { ...counts, wallet: prev.wallet } : counts;
  await admin
    .from("push_campaigns")
    .update({ status: "sent", sent_at: new Date().toISOString(), stats })
    .eq("id", campaignId);
}

// Procesa un lote de la cola de envíos. Llamado por /api/cron/drain.
export async function processPushQueue(limit = 50): Promise<{
  sent: number;
  failed: number;
  expired: number;
  skipped: number;
}> {
  const out = { sent: 0, failed: 0, expired: 0, skipped: 0 };
  if (!pushConfigured()) return out;
  vapid();
  const admin = supabaseAdmin();

  await queueDueCampaigns(admin);

  const { data: deliveries } = await admin
    .from("push_deliveries")
    .select(
      "id, campaign_id, organization_id, attempts, " +
        "push_subscriptions!inner(id, customer_id, endpoint, p256dh, auth, status, customers!inner(status, push_consent_state, first_name))",
    )
    .eq("status", "queued")
    .order("created_at")
    .limit(limit);

  const batch = (deliveries ?? []) as unknown as QueuedDelivery[];
  // Token de tarjeta por cliente: el enlace interno de la campaña se abre en
  // SU tarjeta (/t/[token]/…), no en la raíz del sitio.
  const customerIds = [
    ...new Set(batch.map((d) => d.push_subscriptions?.customer_id).filter(Boolean)),
  ] as string[];
  const tokenByCustomer = new Map<string, string>();
  if (customerIds.length) {
    const { data: cards } = await admin
      .from("customer_cards")
      .select("customer_id, token")
      .in("customer_id", customerIds)
      .eq("status", "active");
    for (const c of cards ?? []) tokenByCustomer.set(c.customer_id, c.token);
  }

  const orgIds = [...new Set(batch.map((d) => d.organization_id))];
  const orgName = new Map<string, string>();
  if (orgIds.length) {
    const { data: orgs } = await admin.from("organizations").select("id, name").in("id", orgIds);
    for (const o of orgs ?? []) orgName.set(o.id, o.name);
  }

  for (const d of batch) {
    const sub = d.push_subscriptions;
    const cust = Array.isArray(sub?.customers) ? sub?.customers[0] : sub?.customers;
    // Re-chequeo en el envío: baja de consentimiento, cliente inactivo o
    // suscripción muerta → se marca y no se envía.
    if (
      !sub ||
      sub.status !== "active" ||
      !cust ||
      cust.status !== "active" ||
      cust.push_consent_state !== "granted"
    ) {
      await admin
        .from("push_deliveries")
        .update({ status: "skipped", processed_at: new Date().toISOString() })
        .eq("id", d.id);
      out.skipped += 1;
      continue;
    }

    const { data: campaign } = (await admin
      .from("push_campaigns")
      .select("id, title, body, url, status")
      .eq("id", d.campaign_id)
      .maybeSingle()) as { data: CampaignRow | null };
    // Campaña cancelada/eliminada entre encolado y envío → no se envía.
    if (!campaign || campaign.status !== "sending") {
      await admin
        .from("push_deliveries")
        .update({ status: "skipped", processed_at: new Date().toISOString() })
        .eq("id", d.id);
      out.skipped += 1;
      continue;
    }

    const vars = { negocio: orgName.get(d.organization_id) ?? null, nombre: cust.first_name };

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: renderCampaignText(campaign.title, vars),
          body: renderCampaignText(campaign.body, vars),
          url: resolveCampaignUrl(campaign.url, tokenByCustomer.get(sub.customer_id) ?? null),
        }),
        // urgency:high → FCM prioridad alta: despierta el dispositivo al
        // instante aunque Chrome esté dormido (Doze/MIUI). Con prioridad
        // normal Android difiere la entrega y el usuario no ve nada.
        { TTL: 60 * 60 * 24, urgency: "high" },
      );
      await admin
        .from("push_deliveries")
        .update({ status: "sent", processed_at: new Date().toISOString() })
        .eq("id", d.id);
      out.sent += 1;
    } catch (e) {
      const statusCode =
        e && typeof e === "object" && "statusCode" in e
          ? Number((e as { statusCode: unknown }).statusCode)
          : 0;
      if (statusCode === 404 || statusCode === 410) {
        // Endpoint muerto: entrega expirada + suscripción desactivada.
        await admin
          .from("push_deliveries")
          .update({ status: "expired", processed_at: new Date().toISOString() })
          .eq("id", d.id);
        await admin
          .from("push_subscriptions")
          .update({ status: "expired", last_error: `http_${statusCode}` })
          .eq("id", sub.id);
        out.expired += 1;
      } else {
        // Un reintento máximo; luego falla de forma permanente.
        const attempts = (d.attempts ?? 0) + 1;
        await admin
          .from("push_deliveries")
          .update(
            attempts >= 2
              ? { status: "failed", attempts, error_code: `http_${statusCode || "err"}`, processed_at: new Date().toISOString() }
              : { attempts, error_code: `http_${statusCode || "err"}` },
          )
          .eq("id", d.id);
        if (attempts >= 2) out.failed += 1;
      }
    }
  }

  // Cierra toda campaña en 'sending' sin entregas pendientes — incluidas las
  // que se encolaron con 0 destinatarios (nunca generan lote propio).
  const { data: sending } = await admin
    .from("push_campaigns")
    .select("id")
    .eq("status", "sending");
  for (const c of sending ?? []) await finishCampaignIfDone(admin, c.id);
  return out;
}
