"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { enqueueEmail, trySendOutbox } from "@/lib/email/outbox";
import { logoToDataUri } from "@/lib/organizations/logo";
import { processPushQueue, pushConfigured, saveWalletStats } from "@/lib/push/send";
import { pushCampaignToWallets, syncWalletLocations, type LocationSyncResult } from "@/lib/wallet/push";
import { CARD_DESTINATIONS, scheduleToDate } from "@/lib/push/destination";
import { STAMP_ICON_KEYS } from "@/app/t/[token]/_components/stamp-icons";

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

// Errores estables del trigger guard_org_owners (migración 0017).
function memberChangeError(
  error: { code?: string; message: string },
  fallback: string,
): string {
  if (error.message.includes("last_owner"))
    return "La organización debe conservar al menos un owner activo. Asciende a otra persona primero.";
  if (error.message.includes("owner_required"))
    return "Solo un owner puede ascender, degradar, suspender o eliminar a un owner.";
  if (error.code === "42501") return "Sin permiso para esta acción.";
  return fallback;
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

// Borrado real, no solo desactivación — a petición del comercio. Si la
// recompensa ya tiene canjes asociados, la FK de `redemptions` bloquea el
// DELETE (23503): esa evidencia de canje es inmutable, así que se devuelve
// un error claro en vez de dejar caer la excepción cruda.
export async function deleteReward(orgSlug: string, rewardId: string) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/rewards`;

  const { error } = await supabase
    .from("rewards")
    .delete()
    .eq("id", rewardId)
    .eq("organization_id", orgId);
  if (error) {
    fail(
      back,
      error.code === "23503"
        ? "No se puede eliminar: ya tiene canjes registrados. Desactívala en su lugar."
        : "No se pudo eliminar la recompensa.",
    );
  }

  await audit(orgId, user.id, "reward.deleted", "reward", rewardId);
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Recompensa eliminada."));
}

// ---------- Sedes ------------------------------------------------------------

// Texto para el comercio tras republicar la clase de Wallet con sus sedes.
function locationSyncNote(r: LocationSyncResult): string {
  if (!r.ok)
    return r.error === "wallet_not_configured"
      ? ""
      : " No se pudo actualizar Google Wallet; usa «Sincronizar con Wallet» para reintentar.";
  return r.published
    ? " Google Wallet actualizado."
    : " Se aplicará en Google Wallet cuando se emita el primer pase.";
}

// Solo sincroniza si el comercio activó la proximidad en Wallet.
async function syncIfProximity(orgId: string): Promise<string> {
  const { data } = await supabaseAdmin()
    .from("organizations")
    .select("features")
    .eq("id", orgId)
    .maybeSingle();
  if ((data?.features as Record<string, unknown> | null)?.wallet_proximity !== true) return "";
  return locationSyncNote(await syncWalletLocations(orgId));
}

export async function saveLocation(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/locations`;
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const lat = latRaw === "" ? null : Number(latRaw);
  const lng = lngRaw === "" ? null : Number(lngRaw);

  if (name.length < 1 || name.length > 120) fail(back, "Nombre inválido.");
  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90))
    fail(back, "Latitud inválida (-90 a 90).");
  if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))
    fail(back, "Longitud inválida (-180 a 180).");
  if ((lat === null) !== (lng === null))
    fail(back, "Indica latitud y longitud juntas o ninguna.");

  const payload = { name, address, lat, lng };
  const q = id
    ? supabase.from("locations").update(payload).eq("id", id).eq("organization_id", orgId)
    : supabase.from("locations").insert({ organization_id: orgId, ...payload });

  const { error } = await q;
  if (error) fail(back, "No se pudo guardar la sede.");

  await audit(orgId, user.id, id ? "location.updated" : "location.created", "location", id ?? "", {
    name,
  });
  revalidatePath(back);
  const note = await syncIfProximity(orgId);
  redirect(back + "?ok=" + encodeURIComponent("Sede guardada." + note));
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
  await syncIfProximity(orgId);
  revalidatePath(`/dashboard/${orgSlug}/locations`);
}

// Reintento manual: republica la clase de Wallet con las sedes actuales.
export async function syncLocationsToWallet(orgSlug: string) {
  const { user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/locations`;
  if (!["owner", "admin", "manager"].includes(role))
    fail(back, "Solo manager+ puede sincronizar con Wallet.");
  const res = await syncWalletLocations(orgId);
  await audit(orgId, user.id, "location.wallet_sync", "organization", orgId, {
    ok: res.ok,
    ...(res.ok ? { published: res.published } : { error: res.error }),
  });
  revalidatePath(back);
  if (!res.ok)
    fail(
      back,
      res.error === "wallet_not_configured"
        ? "Google Wallet no está configurado en el servidor."
        : "Google rechazó la actualización de la clase. Revisa las coordenadas e inténtalo de nuevo.",
    );
  redirect(
    back +
      "?ok=" +
      encodeURIComponent(
        res.published
          ? "Sedes publicadas en Google Wallet."
          : "Sin pases emitidos todavía: las sedes se aplicarán al emitir el primero.",
      ),
  );
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

  // Correo de invitación vía outbox (reintentable por cron). Un id nuevo por
  // invitación: reinvitar al mismo correo reenvía el mensaje.
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const queued = await enqueueEmail({
    orgId,
    kind: "team_invite",
    toEmail: email,
    payload: { org_name: org?.name ?? "tu comercio", role: inviteRole, invited_email: email },
    idempotencyKey: `team_invite:${crypto.randomUUID()}`,
  });
  const sent = queued.id ? await trySendOutbox(queued.id) : false;

  revalidatePath(back);
  redirect(
    back +
      "?ok=" +
      encodeURIComponent(
        sent
          ? `Invitación enviada a ${email}.`
          : `Invitación creada para ${email}, pero el correo aún no salió (quedó en cola y se reintenta). Puedes avisarle tú: se activa al iniciar sesión con ese correo.`,
      ),
  );
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
  if (error) fail(back, memberChangeError(error, "No se pudo cambiar el rol."));

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
    fail(
      `/dashboard/${orgSlug}/team`,
      memberChangeError(error, "No se pudo cambiar el estado."),
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
  const stampIcon = String(formData.get("stamp_icon") ?? "").trim();
  const logoFile = formData.get("logo");
  const removeLogo = formData.get("remove_logo") === "on";

  if (name.length < 2 || name.length > 120) fail(back, "Nombre inválido.");
  if (!/^[A-Z]{3}$/.test(currency)) fail(back, "Moneda inválida (ISO 4217).");
  if (brandColor && !/^#[0-9a-fA-F]{6}$/.test(brandColor))
    fail(back, "Color inválido (formato #RRGGBB).");
  if (stampIcon && !(STAMP_ICON_KEYS as readonly string[]).includes(stampIcon))
    fail(back, "Figura de sello inválida.");

  // El logo se adjunta como archivo (PNG sin fondo) — si no se sube uno
  // nuevo, se conserva el existente; "Quitar logo" lo borra explícitamente.
  let newLogoUrl: string | null | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    newLogoUrl = await logoToDataUri(logoFile);
    if (!newLogoUrl)
      fail(back, "No se pudo usar ese archivo como logo: debe ser una imagen (PNG, JPG, WebP o SVG) de máximo 10 MB.");
  } else if (removeLogo) {
    newLogoUrl = null;
  }

  const { data: current } = await supabase
    .from("organizations")
    .select("brand")
    .eq("id", orgId)
    .single();
  const brand = { ...((current?.brand ?? {}) as Record<string, unknown>) };
  if (brandColor) brand.color = brandColor;
  else delete brand.color;
  if (stampIcon) brand.stamp_icon = stampIcon;
  if (newLogoUrl !== undefined) {
    if (newLogoUrl) brand.logo_url = newLogoUrl;
    else delete brand.logo_url;
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name, currency, timezone, brand })
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

// Privacidad + flags por comercio: responsable del tratamiento, correo de
// privacidad, URL de la política y versión del texto de consentimiento
// (evidencia legal). Los flags activan autorregistro QR, push y ubicación.
export async function updateOrgPrivacy(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/settings`;
  if (!["owner", "admin"].includes(role))
    fail(back, "Solo owner/admin puede cambiar la configuración.");

  const privacyEmail = String(formData.get("privacy_email") ?? "").trim().toLowerCase();
  const policyText = String(formData.get("policy_text") ?? "").trim();
  const controller = String(formData.get("data_controller") ?? "").trim();
  const consentVersion = String(formData.get("consent_version") ?? "").trim() || "v1";

  if (privacyEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(privacyEmail))
    fail(back, "Correo de privacidad inválido.");
  if (controller.length > 200) fail(back, "Responsable demasiado largo.");
  if (consentVersion.length > 40) fail(back, "Versión inválida.");
  if (policyText.length > 20000) fail(back, "La política es demasiado larga (máx. 20.000 caracteres).");

  const flag = (k: string) => formData.get(k) === "on";
  const legal: Record<string, string> = { consent_version: consentVersion };
  if (privacyEmail) legal.privacy_email = privacyEmail;
  if (policyText) legal.policy_text = policyText;
  if (controller) legal.data_controller = controller;

  const features = {
    self_registration: flag("feat_self_registration"),
    push: flag("feat_push"),
    location: flag("feat_location"),
    wallet_proximity: flag("feat_wallet_proximity"),
  };

  const { data: prevOrg } = await supabase
    .from("organizations")
    .select("features")
    .eq("id", orgId)
    .maybeSingle();
  const proximityWasOn =
    (prevOrg?.features as Record<string, unknown> | null)?.wallet_proximity === true;

  const { error } = await supabase
    .from("organizations")
    .update({ legal, features })
    .eq("id", orgId);
  if (error) fail(back, "No se pudo guardar la configuración de privacidad.");

  await audit(orgId, user.id, "org.privacy_updated", "organization", orgId, {
    consent_version: consentVersion,
    features,
  });
  // Cambiar la proximidad publica o retira las sedes de la clase de Wallet.
  const note =
    features.wallet_proximity || proximityWasOn
      ? locationSyncNote(await syncWalletLocations(orgId))
      : "";
  revalidatePath(`/dashboard/${orgSlug}/settings`);
  redirect(back + "?ok=" + encodeURIComponent("Privacidad y funciones guardadas." + note));
}

// Rotar el QR de autorregistro (join_token) ante abuso o fuga. Admin+,
// respaldado además por la RPC (owner/admin en DB).
export async function rotateJoinToken(orgSlug: string) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/join`;
  if (!["owner", "admin"].includes(role))
    fail(back, "Solo owner/admin puede rotar el QR de registro.");

  const { error } = await supabase.rpc("rotate_join_token", { p_org_id: orgId });
  if (error) fail(back, "No se pudo rotar el QR.");

  await audit(orgId, user.id, "org.join_token_rotated", "organization", orgId);
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("QR de registro rotado. Imprime el nuevo."));
}

// ---------- Campañas push ------------------------------------------------------

type OrgCtx = Awaited<ReturnType<typeof requireMembership>>;

// Encola la campaña (audiencia resuelta en servidor), drena la cola al
// instante y empuja el mismo mensaje a los pases Google. Devuelve el resumen
// para el aviso; los errores redirigen con ?error=.
async function dispatchCampaign(
  ctx: OrgCtx,
  orgSlug: string,
  campaign: { id: string; title: string; body: string },
): Promise<string> {
  const { supabase, user, orgId } = ctx;
  const back = `/dashboard/${orgSlug}/campaigns`;

  const { data: count, error } = await supabase.rpc("queue_push_campaign", {
    p_campaign_id: campaign.id,
  });
  if (error) {
    const m = error.message;
    fail(
      back,
      m.includes("plan_limit")
        ? "Límite mensual de campañas alcanzado para tu plan."
        : m.includes("invalid_status")
          ? "La campaña ya está en envío o fue enviada."
          : "No se pudo encolar la campaña.",
    );
  }
  await audit(orgId, user.id, "campaign.queued", "push_campaign", campaign.id, {
    recipients: count,
  });

  // "Enviar ahora" envía de verdad: drena la cola al instante en vez de
  // esperar al cron diario. Si el servidor no tiene push configurado la
  // campaña queda encolada igual (el cron la recogerá después).
  const drain = pushConfigured()
    ? await processPushQueue(50).catch(() => null)
    : null;

  // Además del push del navegador, el mensaje viaja a los pases Google
  // entregados (TEXT_AND_NOTIFY si hay cuota; TEXT si se agotó — Google
  // permite máx. 3 avisos por pase cada 24h).
  const wallet = await pushCampaignToWallets(orgId, campaign.title, campaign.body).catch(
    () => null,
  );
  if (wallet) await saveWalletStats(supabaseAdmin(), campaign.id, wallet);

  const parts: string[] = [
    drain
      ? `Campaña enviada: ${drain.sent} entregada(s)` +
        (drain.failed ? `, ${drain.failed} fallida(s)` : "") +
        (drain.expired ? `, ${drain.expired} expirada(s)` : "") +
        (drain.skipped ? `, ${drain.skipped} omitida(s)` : "")
      : `Enviando a ${count ?? 0} destinatario(s)`,
  ];
  if (wallet?.notified) parts.push(`${wallet.notified} aviso(s) en wallet`);
  if (wallet?.limited)
    parts.push(
      `${wallet.limited} pase(s) sin aviso: Google permite máx. 3 notificaciones de este tipo por pase cada 24 h`,
    );
  if (wallet?.failed) parts.push(`${wallet.failed} pase(s) con error`);
  return parts.join(" · ") + ".";
}

// Crea la campaña y, según `intent`: guarda borrador, programa o envía ya.
export async function savePushCampaign(orgSlug: string, formData: FormData) {
  const ctx = await requireMembership(orgSlug);
  const { supabase, user, orgId, role } = ctx;
  const back = `/dashboard/${orgSlug}/campaigns`;
  if (!["owner", "admin", "manager"].includes(role))
    fail(back, "Solo manager+ puede crear campañas.");

  const intent = String(formData.get("intent") ?? "draft");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const dest = String(formData.get("dest") ?? "card");
  const custom = String(formData.get("url") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const tz = Number(formData.get("tz") ?? 0);

  if (title.length < 1 || title.length > 100) fail(back, "Título inválido (máx. 100).");
  if (body.length < 1 || body.length > 300) fail(back, "Mensaje inválido (máx. 300).");

  let url: string | null = null;
  if (dest === "custom") {
    if (!/^https:\/\//.test(custom)) fail(back, "El enlace externo debe empezar por https://");
    url = custom;
  } else {
    url = CARD_DESTINATIONS.find((d) => d.value === dest)?.url ?? null;
  }

  let at: Date | null = null;
  if (intent === "schedule") {
    at = scheduleToDate(schedule, tz);
    if (!Number.isFinite(at.getTime()) || at.getTime() < Date.now() + 60_000)
      fail(back, "La fecha de envío debe ser futura (mínimo 1 minuto).");
  }

  const { data: campaign, error } = await supabase
    .from("push_campaigns")
    .insert({
      organization_id: orgId,
      created_by: user.id,
      title,
      body,
      url,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !campaign) fail(back, "No se pudo crear la campaña.");

  await audit(orgId, user.id, "campaign.created", "push_campaign", campaign.id, { title });

  if (at) {
    const { error: e2 } = await supabase.rpc("schedule_push_campaign", {
      p_campaign_id: campaign.id,
      p_at: at.toISOString(),
    });
    if (e2) fail(back, "No se pudo programar la campaña.");
  }

  let msg = "Borrador guardado.";
  if (at) msg = "Campaña programada.";
  if (intent === "send") msg = await dispatchCampaign(ctx, orgSlug, { id: campaign.id, title, body });

  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent(msg));
}

export async function queuePushCampaign(orgSlug: string, campaignId: string) {
  const ctx = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/campaigns`;
  if (!["owner", "admin", "manager"].includes(ctx.role))
    fail(back, "Solo manager+ puede enviar campañas.");

  const { data: campaign } = await ctx.supabase
    .from("push_campaigns")
    .select("id, title, body")
    .eq("id", campaignId)
    .eq("organization_id", ctx.orgId)
    .maybeSingle();
  if (!campaign) fail(back, "Campaña no encontrada.");

  const msg = await dispatchCampaign(ctx, orgSlug, campaign);
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent(msg));
}

// Copia una campaña como borrador nuevo (reutilizar textos que funcionaron).
export async function duplicatePushCampaign(orgSlug: string, campaignId: string) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/campaigns`;
  if (!["owner", "admin", "manager"].includes(role))
    fail(back, "Solo manager+ puede crear campañas.");

  const { data: src } = await supabase
    .from("push_campaigns")
    .select("title, body, url")
    .eq("id", campaignId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!src) fail(back, "Campaña no encontrada.");

  const { data: copy, error } = await supabase
    .from("push_campaigns")
    .insert({
      organization_id: orgId,
      created_by: user.id,
      title: src.title,
      body: src.body,
      url: src.url,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !copy) fail(back, "No se pudo duplicar la campaña.");

  await audit(orgId, user.id, "campaign.duplicated", "push_campaign", copy.id, {
    from: campaignId,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Copia creada como borrador."));
}

export async function cancelPushCampaign(orgSlug: string, campaignId: string) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/campaigns`;
  if (!["owner", "admin", "manager"].includes(role))
    fail(back, "Solo manager+ puede cancelar campañas.");

  const { error } = await supabase.rpc("cancel_push_campaign", {
    p_campaign_id: campaignId,
  });
  if (error) fail(back, "No se pudo cancelar la campaña.");

  await audit(orgId, user.id, "campaign.cancelled", "push_campaign", campaignId);
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Campaña cancelada."));
}

// ---------- Derechos del titular ----------------------------------------------

const RIGHTS_STATUSES = ["in_progress", "resolved", "rejected"] as const;

// Gestión de una solicitud de derechos (Ley 1581). Todo pasa por la RPC
// resolve_rights_request: valida la transición, exige respuesta al cerrar y,
// si es supresión/retiro de autorización, ejecuta la acción sobre los datos.
export async function updateRightsRequest(
  orgSlug: string,
  requestId: string,
  formData: FormData,
) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/rights`;
  const status = String(formData.get("status") ?? "");
  const response = String(formData.get("response") ?? "").trim();
  if (!(RIGHTS_STATUSES as readonly string[]).includes(status)) fail(back, "Acción inválida.");

  const { data, error } = await supabase.rpc("resolve_rights_request", {
    p_request_id: requestId,
    p_status: status,
    p_response: response || null,
  });
  if (error) {
    const m = error.message;
    fail(
      back,
      m.includes("response_required")
        ? "Escribe una respuesta para el titular (mínimo 10 caracteres) antes de cerrar la solicitud."
        : m.includes("invalid_transition")
          ? "Esa solicitud ya fue cerrada o ya está en trámite."
          : m.includes("forbidden_destructive")
            ? "Solo un owner o admin puede ejecutar una supresión o retiro de autorización."
            : m.includes("forbidden")
              ? "Solo manager+ puede gestionar solicitudes."
              : "No se pudo actualizar la solicitud.",
    );
  }

  const r = data as {
    request_type: string;
    org_name: string;
    notify_email: string | null;
    first_name: string | null;
  } | null;

  await audit(orgId, user.id, `rights_request.${status}`, "data_rights_request", requestId, {
    request_type: r?.request_type,
  });

  // Respuesta al titular por correo (el email se capturó antes de anonimizar).
  let notified: boolean | null = null;
  if (status !== "in_progress" && r?.notify_email) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("legal")
      .eq("id", orgId)
      .maybeSingle();
    const queued = await enqueueEmail({
      orgId,
      kind: "rights_response",
      toEmail: r.notify_email,
      payload: {
        org_name: r.org_name,
        first_name: r.first_name ?? undefined,
        request_type: r.request_type,
        status,
        response,
        privacy_email: ((orgRow?.legal ?? {}) as Record<string, string>).privacy_email,
      },
      idempotencyKey: `rights_response:${requestId}`,
    });
    notified = queued.id ? await trySendOutbox(queued.id, { scrubRecipient: true }) : false;
  }

  revalidatePath(back);
  const base =
    status === "in_progress"
      ? "Solicitud en trámite."
      : status === "rejected"
        ? "Solicitud rechazada."
        : r?.request_type === "erasure"
          ? "Solicitud resuelta: los datos del titular fueron eliminados (el historial de sellos se conserva sin datos personales)."
          : r?.request_type === "revocation"
            ? "Solicitud resuelta: autorización retirada y tarjeta cerrada."
            : "Solicitud resuelta.";
  const mail =
    notified === true
      ? " Respuesta enviada al titular."
      : notified === false
        ? " El correo al titular quedó en cola (se reintenta); si no sale, contáctalo tú."
        : status !== "in_progress"
          ? " El titular no tiene correo registrado: contáctalo por otro medio."
          : "";
  redirect(back + "?ok=" + encodeURIComponent(base + mail));
}

// ---------- Cerrar / eliminar la organización (solo owner) -------------------

// Cierre (soft): revoca tarjetas, borra suscripciones push y cancela campañas;
// el historial se conserva. La org desaparece de "Mis organizaciones".
export async function closeOrganization(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/settings`;
  if (role !== "owner") fail(back, "Solo el propietario puede cerrar la organización.");
  if (String(formData.get("confirm_slug") ?? "").trim() !== orgSlug) {
    fail(back, "Escribe el identificador exacto de la organización para confirmar.");
  }

  const { data, error } = await supabase.rpc("close_organization", { p_org_id: orgId });
  if (error) {
    fail(
      back,
      error.message.includes("already_closed")
        ? "La organización ya estaba cerrada."
        : "No se pudo cerrar la organización.",
    );
  }
  await audit(orgId, user.id, "organization.closed", "organization", orgId, {
    cards_revoked: (data as { cards_revoked?: number } | null)?.cards_revoked ?? 0,
  });
  redirect(
    "/dashboard?ok=" +
      encodeURIComponent(
        "Organización cerrada. Sus tarjetas fueron revocadas y su historial se conserva.",
      ),
  );
}

// Eliminación definitiva: solo si la organización nunca tuvo movimientos,
// visitas ni canjes (p. ej. creada por error). Con historial se cierra.
export async function deleteOrganization(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId, role } = await requireMembership(orgSlug);
  const back = `/dashboard/${orgSlug}/settings`;
  if (role !== "owner") fail(back, "Solo el propietario puede eliminar la organización.");
  const confirmSlug = String(formData.get("confirm_slug") ?? "").trim();

  // Auditoría ANTES: la fila queda (org_id pasa a NULL al borrar la org).
  await audit(orgId, user.id, "organization.deleted", "organization", orgId, { slug: orgSlug });

  const { error } = await supabase.rpc("delete_organization", {
    p_org_id: orgId,
    p_slug: confirmSlug,
  });
  if (error) {
    const m = error.message;
    fail(
      back,
      m.includes("slug_mismatch")
        ? "Escribe el identificador exacto de la organización para confirmar."
        : m.includes("has_history")
          ? "Esta organización ya tiene movimientos, visitas o canjes y no puede eliminarse. Ciérrala: se conserva el historial."
          : "No se pudo eliminar la organización.",
    );
  }
  redirect("/dashboard?ok=" + encodeURIComponent("Organización eliminada."));
}
