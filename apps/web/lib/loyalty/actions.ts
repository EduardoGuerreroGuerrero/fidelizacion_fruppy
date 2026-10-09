"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

async function audit(
  orgId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabaseAdmin().from("audit_logs").insert({
      organization_id: orgId,
      actor_user_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
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
