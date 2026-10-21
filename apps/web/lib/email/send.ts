import { optionalEnv } from "@/lib/env";

// Adaptador de correo transaccional (Resend). Solo se importa en server
// code: la API key nunca llega al bundle del cliente. Devuelve el resultado
// sin lanzar — el caller decide si encola para reintento (outbox).

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

export function emailConfigured(): boolean {
  return !!optionalEnv("RESEND_API_KEY");
}

export function senderFor(orgName: string): string {
  return optionalEnv("EMAIL_FROM") ?? `${orgName} <notificaciones@pineappleloyalty.com>`;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = optionalEnv("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "email_not_configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      return { ok: false, error: `provider_${res.status}${body?.message ? `:${body.message}` : ""}` };
    }
    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: body?.id };
  } catch (e) {
    return { ok: false, error: `network:${e instanceof Error ? e.message : "unknown"}` };
  }
}
