import { optionalEnv } from "@/lib/env";
import { displayName } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase/server";
import { senderFor, sendEmail } from "./send";

// Outbox transaccional: el registro del cliente NUNCA depende del proveedor
// de correo. Se encola y se intenta el envío; si falla queda 'queued' para
// el drenaje por cron (/api/cron/drain) o reintento manual.
//
// El html NO se persiste: se reconstruye desde kind + payload en cada envío
// (mínima PII retenida en la cola).

export type OutboxKind = "welcome_card" | "card_delivery";

type OutboxPayload = {
  first_name?: string;
  org_name?: string;
  program_name?: string;
  card_token?: string;
};

function cardUrl(token: string): string {
  const base = optionalEnv("NEXT_PUBLIC_BASE_URL") ?? "http://localhost:3000";
  return `${base}/t/${token}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function render(kind: OutboxKind, p: OutboxPayload): { subject: string; html: string } | null {
  const org = p.org_name ?? "el comercio";
  const program = p.program_name ?? "tu programa de fidelización";
  const name = displayName(p.first_name ?? "");
  const url = p.card_token ? cardUrl(p.card_token) : null;
  if (!url) return null;

  const greeting = name ? `Hola ${escapeHtml(name)}` : "Hola";
  const subject =
    kind === "welcome_card"
      ? `Bienvenido a ${org} — tu tarjeta de fidelización`
      : `Tu tarjeta ${org} — ${program}`;
  const lead =
    kind === "welcome_card"
      ? `Te registraste en <strong>${escapeHtml(program)}</strong> de <strong>${escapeHtml(org)}</strong>. Guarda este correo: aquí está tu tarjeta digital.`
      : `Aquí está tu tarjeta digital de <strong>${escapeHtml(program)}</strong>.`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#262626">
      <h2 style="color:#0d9488">${greeting}, esta es tu tarjeta ${escapeHtml(org)}</h2>
      <p>${lead}</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${url}" style="background:#0d9488;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">Abrir mi tarjeta</a>
      </p>
      <p style="text-align:center">
        <img src="${url}/qr" alt="QR de tu tarjeta" width="220" height="220" style="border-radius:16px"/>
      </p>
      <p style="font-size:13px;color:#737373">
        En tu próxima visita muestra este código QR en caja para sumar sellos.
        También puedes abrir tu tarjeta desde cualquier navegador con este enlace:
        <a href="${url}">${url}</a>
      </p>
      <p style="font-size:12px;color:#a3a3a3">Powered by PineappleLoyalty — fidelización digital</p>
    </div>`;
  return { subject, html };
}

// Encola un correo transaccional. Idempotente por (org, idempotency_key):
// un reintento de registro no duplica el correo.
export async function enqueueEmail({
  orgId,
  customerId,
  kind,
  toEmail,
  payload,
  idempotencyKey,
}: {
  orgId: string;
  customerId: string;
  kind: OutboxKind;
  toEmail: string;
  payload: OutboxPayload;
  idempotencyKey: string;
}): Promise<{ queued: boolean; id?: string }> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("email_outbox")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      kind,
      to_email: toEmail,
      payload,
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();
  if (error) {
    // Colisión de idempotencia: ya estaba encolado → no es un error real.
    if (error.code === "23505") return { queued: false };
    console.error("[email-outbox] enqueue failed:", error.code);
    return { queued: false };
  }
  return { queued: true, id: data?.id };
}

// Intenta enviar una fila concreta de la cola (post-registro, best-effort).
export async function trySendOutbox(id: string): Promise<void> {
  const admin = supabaseAdmin();
  const { data: row } = await admin
    .from("email_outbox")
    .select("id, kind, to_email, payload, status")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.status !== "queued") return;

  const rendered = render(row.kind as OutboxKind, (row.payload ?? {}) as OutboxPayload);
  const orgName = ((row.payload ?? {}) as OutboxPayload).org_name ?? "Comercio";
  const result = rendered
    ? await sendEmail({
        to: row.to_email,
        subject: rendered.subject,
        html: rendered.html,
        from: senderFor(orgName),
      })
    : { ok: false as const, error: "render_failed" };

  await admin
    .from("email_outbox")
    .update(
      result.ok
        ? { status: "sent", sent_at: new Date().toISOString(), last_error: null }
        : { attempts: 1, last_error: result.error.slice(0, 300) },
    )
    .eq("id", id);
}

// Drenaje periódico (cron): reintenta los queued con tope de intentos.
export async function drainEmailOutbox(limit = 25): Promise<{ sent: number; failed: number }> {
  const admin = supabaseAdmin();
  const { data: rows } = await admin
    .from("email_outbox")
    .select("id, kind, to_email, payload, attempts")
    .eq("status", "queued")
    .order("created_at")
    .limit(limit);

  let sent = 0;
  let failed = 0;
  for (const row of rows ?? []) {
    const rendered = render(row.kind as OutboxKind, (row.payload ?? {}) as OutboxPayload);
    const orgName = ((row.payload ?? {}) as OutboxPayload).org_name ?? "Comercio";
    const result = rendered
      ? await sendEmail({
          to: row.to_email,
          subject: rendered.subject,
          html: rendered.html,
          from: senderFor(orgName),
        })
      : { ok: false as const, error: "render_failed" };

    const attempts = (row.attempts ?? 0) + 1;
    // Tras 5 intentos se marca 'failed': queda evidencia sin reintentos eternos.
    const status = result.ok ? "sent" : attempts >= 5 ? "failed" : "queued";
    await admin
      .from("email_outbox")
      .update({
        status,
        attempts,
        sent_at: result.ok ? new Date().toISOString() : null,
        last_error: result.ok ? null : result.error.slice(0, 300),
      })
      .eq("id", row.id);
    if (result.ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}
