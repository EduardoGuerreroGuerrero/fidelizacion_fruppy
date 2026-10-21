"use server";

import { redirect } from "next/navigation";
import { optionalEnv } from "@/lib/env";
import { senderFor, sendEmail } from "@/lib/email/send";
import { escapeHtml } from "@/lib/html";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TOPICS: Record<string, string> = {
  demo: "Quiero implementar PineappleLoyalty",
  soporte: "Soporte técnico",
  facturacion: "Planes y facturación",
  datos: "Datos personales / privacidad",
  otro: "Otro",
};

function fail(msg: string): never {
  redirect("/contacto?error=" + encodeURIComponent(msg));
}

// Formulario público de contacto → correo al equipo (reply-to = visitante).
// Sin DB: honeypot + límites de longitud contra spam básico.
export async function sendContactMessage(formData: FormData) {
  // Honeypot: un humano no ve este campo; si viene lleno, fingimos éxito.
  if (String(formData.get("website") ?? "").trim() !== "") redirect("/contacto?sent=1");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const topicKey = String(formData.get("topic") ?? "otro");
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2 || name.length > 80) fail("Escribe tu nombre (2 a 80 caracteres).");
  if (!EMAIL_RE.test(email) || email.length > 120) fail("Escribe un correo válido para responderte.");
  if (message.length < 10) fail("Cuéntanos un poco más (mínimo 10 caracteres).");
  if (message.length > 2000) fail("El mensaje es muy largo (máximo 2000 caracteres).");
  const topic = TOPICS[topicKey] ?? TOPICS.otro;

  const to = optionalEnv("SUPPORT_EMAIL") ?? "soporte@pineappleloyalty.com";
  const result = await sendEmail({
    to,
    subject: `[Contacto web] ${topic} — ${name}`,
    from: senderFor("PineappleLoyalty"),
    replyTo: email,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px">
      <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) escribió desde el formulario de contacto.</p>
      <p><strong>Tema:</strong> ${escapeHtml(topic)}</p>
      <blockquote style="margin:12px 0;padding:12px 16px;background:#f5f5f5;border-radius:12px;white-space:pre-wrap">${escapeHtml(message)}</blockquote>
      <p style="font-size:12px;color:#737373">Responde a este correo para contestarle directamente.</p>
    </div>`,
  });

  if (!result.ok) {
    console.error("[contact] envío falló:", result.error);
    fail("No pudimos enviar tu mensaje ahora. Escríbenos a soporte@pineappleloyalty.com.");
  }
  redirect("/contacto?sent=1");
}
