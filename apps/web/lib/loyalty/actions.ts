"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { optionalEnv } from "@/lib/env";

// Auditoría vía RPC write_audit_log: actor = auth.uid(), membresía exigida
// en la función. No requiere service_role.
async function audit(
  orgId: string,
  _actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const supabase = await createClient();
    await supabase.rpc("write_audit_log", {
      p_org: orgId,
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: metadata,
    });
  } catch (e) {
    console.error("[audit]", action, e instanceof Error ? e.message : e);
  }
}

async function requireMembership(orgSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) redirect("/dashboard?error=" + encodeURIComponent("Sin acceso."));

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) redirect("/dashboard?error=" + encodeURIComponent("Sin acceso."));

  return { supabase, user, orgId: org.id, role: membership.role as string };
}

// Emitir tarjeta: crea cuenta (si falta) + tarjeta con token. Idempotente.
export async function issueCard(orgSlug: string, customerId: string, programId: string) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/customers/${customerId}`;

  const { data: cardId, error } = await supabase.rpc("issue_card", {
    p_customer_id: customerId,
    p_program_id: programId,
  });

  if (error) {
    redirect(
      back +
        "?error=" +
        encodeURIComponent(
          error.message.includes("forbidden")
            ? "Sin permiso para emitir tarjetas."
            : "No se pudo emitir la tarjeta.",
        ),
    );
  }

  await audit(orgId, user.id, "card.issued", "customer", customerId, {
    program_id: programId,
    card_id: cardId,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Tarjeta emitida."));
}

export async function revokeCard(orgSlug: string, customerId: string, cardId: string) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/customers/${customerId}`;

  const { error } = await supabase.rpc("revoke_card", { p_card_id: cardId });
  if (error) {
    redirect(back + "?error=" + encodeURIComponent("No se pudo revocar."));
  }

  await audit(orgId, user.id, "card.revoked", "customer", customerId, {
    card_id: cardId,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Tarjeta revocada."));
}

export async function rotateCardToken(orgSlug: string, customerId: string, cardId: string) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/customers/${customerId}`;

  const { error } = await supabase.rpc("rotate_card_token", {
    p_card_id: cardId,
  });
  if (error) {
    redirect(back + "?error=" + encodeURIComponent("No se pudo rotar el QR."));
  }

  await audit(orgId, user.id, "card.token_rotated", "customer", customerId, {
    card_id: cardId,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("QR regenerado."));
}

// Flujo de empleado: un escaneo = visita + sellos en una tx. Idempotente.
export async function scanCard(orgSlug: string, formData: FormData): Promise<void> {
  const { supabase } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/scan`;
  const token = String(formData.get("token") ?? "").trim();
  const stamps = Math.min(
    Math.max(parseInt(String(formData.get("stamps") ?? "1"), 10) || 1, 0),
    20,
  );
  const idem = String(formData.get("idem") ?? "").trim() || null;

  if (!token) {
    redirect(back + "?error=" + encodeURIComponent("Falta el token del QR."));
  }

  const { data, error } = await supabase.rpc("scan_card", {
    p_token: token,
    p_stamps: stamps,
    p_idempotency_key: idem,
  });

  if (error) {
    const m = error.message;
    const friendly = m.includes("card_not_found")
      ? "Tarjeta no encontrada."
      : m.includes("card_revoked")
        ? "Tarjeta revocada."
        : m.includes("rate_limited")
          ? "Demasiados escaneos por minuto. Espera un momento."
          : m.includes("forbidden")
            ? "Sin permiso para registrar visitas en esta organización."
            : "No se pudo registrar la visita.";
    redirect(back + "?error=" + encodeURIComponent(friendly));
  }

  const r = data as {
    first_name?: string;
    current_stamps?: number;
    stamp_goal?: number;
  } | null;
  redirect(
    back +
      "?ok=" +
      encodeURIComponent(
        `Visita registrada: ${r?.first_name ?? "cliente"} — ` +
          `${r?.current_stamps ?? "?"}/${r?.stamp_goal ?? "?"} sellos`,
      ),
  );
}

// Canje atómico: el RPC cobra el saldo y crea la redención en una sola tx.
// La clave de idempotencia viaja en el formulario (una por render de página)
// para que un doble submit/reintento no cobre dos veces.
export async function redeemReward(
  orgSlug: string,
  customerId: string,
  rewardId: string,
  formData: FormData,
) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/customers/${customerId}`;
  const idem = String(formData.get("idem") ?? "").trim() || crypto.randomUUID();

  const { error } = await supabase.rpc("redeem_reward", {
    p_reward_id: rewardId,
    p_customer_id: customerId,
    p_idempotency_key: `redeem:${customerId}:${rewardId}:${idem}`,
  });

  if (error) {
    const m = error.message;
    const friendly = m.includes("insufficient_balance")
      ? "Saldo insuficiente para este canje."
      : m.includes("forbidden")
        ? "Sin permiso para canjear en esta organización."
        : m.includes("reward_not_found") || m.includes("account_not_found")
          ? "Recompensa o cuenta no encontrada."
          : "No se pudo registrar el canje.";
    redirect(back + "?error=" + encodeURIComponent(friendly));
  }

  await audit(orgId, user.id, "reward.redeemed", "customer", customerId, {
    reward_id: rewardId,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Canje registrado."));
}

function cardPublicUrl(token: string): string {
  const base = optionalEnv("NEXT_PUBLIC_BASE_URL") ?? "http://localhost:3000";
  return `${base}/t/${token}`;
}

// Entrega de tarjeta por correo vía Resend. El QR va como <img> a la ruta
// pública /t/<token>/qr (los clientes de correo bloquean data URIs).
export async function sendCardEmail(orgSlug: string, customerId: string, cardId: string) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/customers/${customerId}`;

  const apiKey = optionalEnv("RESEND_API_KEY");
  if (!apiKey) {
    redirect(back + "?error=" + encodeURIComponent("Correo no configurado (falta RESEND_API_KEY)."));
  }

  const [{ data: customer }, { data: org }, { data: card }] = await Promise.all([
    supabase
      .from("customers")
      .select("first_name, email")
      .eq("id", customerId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
    supabase
      .from("customer_cards")
      .select("token, status, account_id")
      .eq("id", cardId)
      .eq("customer_id", customerId)
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);

  if (!card || card.status !== "active") {
    redirect(back + "?error=" + encodeURIComponent("Tarjeta no activa."));
  }
  if (!customer?.email) {
    redirect(back + "?error=" + encodeURIComponent("El cliente no tiene email registrado."));
  }

  const { data: account } = await supabase
    .from("loyalty_accounts")
    .select("loyalty_programs(name)")
    .eq("id", card.account_id)
    .maybeSingle();
  const lp = Array.isArray(account?.loyalty_programs)
    ? account?.loyalty_programs[0]
    : account?.loyalty_programs;
  const programName = lp?.name ?? "tu programa de fidelización";
  const orgName = org?.name ?? "el comercio";
  const cardUrl = cardPublicUrl(card.token);
  const qrUrl = `${cardUrl}/qr`;

  const from = optionalEnv("EMAIL_FROM") ?? `${orgName} <info@fruppyhelados.com>`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#262626">
      <h2 style="color:#0d9488">Hola ${customer.first_name}, esta es tu tarjeta ${orgName}</h2>
      <p>Guarda este correo: aquí está tu tarjeta digital de <strong>${programName}</strong>.</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${cardUrl}" style="background:#0d9488;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">Abrir mi tarjeta</a>
      </p>
      <p style="text-align:center">
        <img src="${qrUrl}" alt="QR de tu tarjeta" width="220" height="220" style="border-radius:16px"/>
      </p>
      <p style="font-size:13px;color:#737373">
        En tu próxima visita muestra este código QR en caja para sumar sellos.
        También puedes abrir tu tarjeta desde cualquier navegador con este enlace:
        <a href="${cardUrl}">${cardUrl}</a>
      </p>
      <p style="font-size:12px;color:#a3a3a3">Powered by Fruppy — fidelización digital</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [customer.email],
      subject: `Tu tarjeta ${orgName} — ${programName}`,
      html,
    }),
  });
  if (!res.ok) {
    redirect(back + "?error=" + encodeURIComponent("No se pudo enviar el correo."));
  }

  await audit(orgId, user.id, "card.emailed", "customer", customerId, { card_id: cardId });
  redirect(back + "?ok=" + encodeURIComponent(`Tarjeta enviada a ${customer.email}.`));
}
