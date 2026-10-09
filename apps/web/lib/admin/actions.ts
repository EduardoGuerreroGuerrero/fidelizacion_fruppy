"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Acciones de administración del comercio (Fase 7). Todas verifican sesión
// + membresía activa en servidor; RLS refuerza en DB. Las policies de
// escritura ya exigen owner/admin/manager según la tabla.

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

// Auditoría vía RPC write_audit_log: actor = auth.uid() (infalsificable),
// membresía exigida en la función. No requiere service_role.
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

function fail(path: string, msg: string): never {
  redirect(path + "?error=" + encodeURIComponent(msg));
}

// ---------- Programas --------------------------------------------------------

export async function saveProgram(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/programs`;
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("program_type") ?? "stamps");
  const stampGoal = parseInt(String(formData.get("stamp_goal") ?? ""), 10);
  const ppcu = parseFloat(String(formData.get("points_per_currency_unit") ?? ""));

  if (name.length < 1 || name.length > 120) fail(back, "Nombre inválido.");
  if (type === "stamps" && !(stampGoal >= 1 && stampGoal <= 1000))
    fail(back, "Meta de sellos inválida (1–1000).");
  if (type === "points" && !(ppcu > 0)) fail(back, "Puntos por unidad de moneda inválido.");
  if (type !== "stamps" && type !== "points") fail(back, "Tipo inválido.");

  const payload = {
    name,
    program_type: type,
    stamp_goal: type === "stamps" ? stampGoal : null,
    points_per_currency_unit: type === "points" ? ppcu : null,
  };

  const q = id
    ? supabase.from("loyalty_programs").update(payload).eq("id", id).eq("organization_id", orgId)
    : supabase
        .from("loyalty_programs")
        .insert({ ...payload, organization_id: orgId })
        .select("id")
        .single();

  const { data, error } = await q;
  if (error) fail(back, "No se pudo guardar el programa.");

  await audit(
    orgId,
    user.id,
    id ? "program.updated" : "program.created",
    "loyalty_program",
    id ?? (data as { id: string } | null)?.id ?? "",
    { name },
  );
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Programa guardado."));
}

export async function setProgramStatus(
  orgSlug: string,
  programId: string,
  status: "active" | "archived",
) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const { error } = await supabase
    .from("loyalty_programs")
    .update({ status })
    .eq("id", programId)
    .eq("organization_id", orgId);
  if (error)
    redirect(
      `/dashboard/${orgSlug}/programs?error=` + encodeURIComponent("No se pudo cambiar el estado."),
    );
  await audit(orgId, user.id, `program.${status}`, "loyalty_program", programId);
  revalidatePath(`/dashboard/${orgSlug}/programs`);
}

// ---------- Recompensas ------------------------------------------------------

export async function saveReward(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/rewards`;
  const id = String(formData.get("id") ?? "") || null;
  const programId = String(formData.get("program_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const costStamps = parseInt(String(formData.get("cost_stamps") ?? ""), 10);
  const costPoints = parseInt(String(formData.get("cost_points") ?? ""), 10);
  const terms = String(formData.get("terms") ?? "").trim() || null;

  if (!programId) fail(back, "Falta el programa.");
  if (name.length < 1 || name.length > 120) fail(back, "Nombre inválido.");
  // Exactamente uno: cost_stamps XOR cost_points (check en DB también).
  const hasStamps = costStamps > 0;
  const hasPoints = costPoints > 0;
  if (hasStamps === hasPoints) fail(back, "Define costo en sellos O en puntos, no ambos.");

  const payload = {
    program_id: programId,
    name,
    cost_stamps: hasStamps ? costStamps : null,
    cost_points: hasPoints ? costPoints : null,
    terms,
  };

  const q = id
    ? supabase.from("rewards").update(payload).eq("id", id).eq("organization_id", orgId)
    : supabase.from("rewards").insert({ ...payload, organization_id: orgId });

  const { error } = await q;
  if (error)
    fail(
      back,
      error.code === "23514"
        ? "El costo no coincide con el tipo del programa."
        : "No se pudo guardar la recompensa.",
    );

  await audit(orgId, user.id, id ? "reward.updated" : "reward.created", "reward", id ?? programId, {
    name,
    program_id: programId,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Recompensa guardada."));
}

export async function setRewardStatus(
  orgSlug: string,
  rewardId: string,
  status: "active" | "inactive",
) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const { error } = await supabase
    .from("rewards")
    .update({ status })
    .eq("id", rewardId)
    .eq("organization_id", orgId);
  if (error)
    redirect(
      `/dashboard/${orgSlug}/rewards?error=` + encodeURIComponent("No se pudo cambiar el estado."),
    );
  await audit(orgId, user.id, `reward.${status}`, "reward", rewardId);
  revalidatePath(`/dashboard/${orgSlug}/rewards`);
}

// ---------- Sedes ------------------------------------------------------------

export async function saveLocation(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/locations`;
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;

  if (name.length < 1 || name.length > 120) fail(back, "Nombre inválido.");

  const q = id
    ? supabase.from("locations").update({ name, address }).eq("id", id).eq("organization_id", orgId)
    : supabase.from("locations").insert({ organization_id: orgId, name, address });

  const { error } = await q;
  if (error) fail(back, "No se pudo guardar la sede.");

  await audit(orgId, user.id, id ? "location.updated" : "location.created", "location", id ?? "", {
    name,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Sede guardada."));
}

export async function setLocationStatus(
  orgSlug: string,
  locationId: string,
  status: "active" | "inactive",
) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const { error } = await supabase
    .from("locations")
    .update({ status })
    .eq("id", locationId)
    .eq("organization_id", orgId);
  if (error)
    redirect(
      `/dashboard/${orgSlug}/locations?error=` +
        encodeURIComponent("No se pudo cambiar el estado."),
    );
  await audit(orgId, user.id, `location.${status}`, "location", locationId);
  revalidatePath(`/dashboard/${orgSlug}/locations`);
}

// ---------- Personal ----------------------------------------------------------

const MEMBER_ROLES = ["owner", "admin", "manager", "staff"] as const;
const INVITE_ROLES = ["admin", "manager", "staff"] as const;

export async function inviteMember(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/team`;
  if (!["owner", "admin", "manager"].includes(role)) fail(back, "Solo manager+ puede invitar.");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const inviteRole = String(formData.get("role") ?? "staff");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(back, "Email inválido.");
  if (!(INVITE_ROLES as readonly string[]).includes(inviteRole)) fail(back, "Rol inválido.");

  const { error } = await supabase.from("organization_invites").upsert(
    {
      organization_id: orgId,
      email,
      role: inviteRole,
      status: "pending",
      invited_by: user.id,
    },
    { onConflict: "organization_id,email" },
  );
  if (error)
    fail(
      back,
      error.code === "42501"
        ? "Sin permiso para invitar (requiere rol manager+)."
        : "No se pudo crear la invitación.",
    );

  await audit(orgId, user.id, "member.invited", "organization_invite", email, {
    role: inviteRole,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent(`Invitación enviada a ${email}.`));
}

export async function cancelInvite(orgSlug: string, inviteId: string) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const { error } = await supabase
    .from("organization_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId)
    .eq("organization_id", orgId);
  if (error)
    redirect(
      `/dashboard/${orgSlug}/team?error=` +
        encodeURIComponent("No se pudo cancelar la invitación."),
    );
  await audit(orgId, user.id, "member.invite_cancelled", "organization_invite", inviteId);
  revalidatePath(`/dashboard/${orgSlug}/team`);
}

export async function setMemberRole(orgSlug: string, memberId: string, formData: FormData) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/team`;
  const role = String(formData.get("role") ?? "");
  if (!(MEMBER_ROLES as readonly string[]).includes(role)) fail(back, "Rol inválido.");

  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", orgId);
  if (error)
    fail(
      back,
      error.code === "42501" ? "Sin permiso para cambiar roles." : "No se pudo cambiar el rol.",
    );

  await audit(orgId, user.id, "member.role_changed", "organization_member", memberId, { role });
  revalidatePath(back);
}

export async function setMemberStatus(
  orgSlug: string,
  memberId: string,
  status: "active" | "suspended",
) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const { error } = await supabase
    .from("organization_members")
    .update({ status })
    .eq("id", memberId)
    .eq("organization_id", orgId);
  if (error)
    redirect(
      `/dashboard/${orgSlug}/team?error=` + encodeURIComponent("No se pudo cambiar el estado."),
    );
  await audit(orgId, user.id, `member.${status}`, "organization_member", memberId);
  revalidatePath(`/dashboard/${orgSlug}/team`);
}

// ---------- Configuración -----------------------------------------------------

export async function updateOrgSettings(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/settings`;
  if (!["owner", "admin"].includes(role))
    fail(back, "Solo owner/admin puede cambiar la configuración.");

  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "COP")
    .trim()
    .toUpperCase();
  const timezone = String(formData.get("timezone") ?? "America/Bogota").trim();
  const brandColor = String(formData.get("brand_color") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();

  if (name.length < 2 || name.length > 120) fail(back, "Nombre inválido.");
  if (!/^[A-Z]{3}$/.test(currency)) fail(back, "Moneda inválida (ISO 4217).");
  if (brandColor && !/^#[0-9a-fA-F]{6}$/.test(brandColor))
    fail(back, "Color inválido (formato #RRGGBB).");
  if (logoUrl && !/^https:\/\//.test(logoUrl)) fail(back, "El logo debe ser una URL https.");

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      currency,
      timezone,
      brand: {
        ...(brandColor ? { color: brandColor } : {}),
        ...(logoUrl ? { logo_url: logoUrl } : {}),
      },
    })
    .eq("id", orgId);
  if (error) fail(back, "No se pudo guardar la configuración.");

  await audit(orgId, user.id, "org.settings_updated", "organization", orgId, {
    name,
    currency,
    timezone,
  });
  revalidatePath(`/dashboard/${orgSlug}`);
  redirect(back + "?ok=" + encodeURIComponent("Configuración guardada."));
}
