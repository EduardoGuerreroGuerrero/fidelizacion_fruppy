"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type FieldErrors = Record<string, string>;

function validateCustomerInput(formData: FormData): {
  values: {
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    birth_date: string | null;
    external_ref: string | null;
    marketing_consent: boolean;
  };
  errors: FieldErrors;
} {
  const text = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const firstName = String(formData.get("first_name") ?? "").trim();
  const email = text("email");
  const phone = text("phone");
  const birthDate = text("birth_date");

  const errors: FieldErrors = {};
  if (firstName.length < 1 || firstName.length > 80)
    errors.first_name = "Nombre requerido (máx. 80 caracteres).";
  const lastName = text("last_name");
  if (lastName && lastName.length > 80) errors.last_name = "Apellido demasiado largo (máx. 80).";
  if (email && !EMAIL_RE.test(email)) errors.email = "Email inválido.";
  if (phone && phone.length > 32) errors.phone = "Teléfono demasiado largo.";
  if (birthDate && Number.isNaN(Date.parse(birthDate))) errors.birth_date = "Fecha inválida.";

  return {
    values: {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      birth_date: birthDate,
      external_ref: text("external_ref"),
      marketing_consent: formData.get("marketing_consent") === "on",
    },
    errors,
  };
}

async function audit(
  orgId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    // audit_logs no tiene INSERT policy para authenticated: va por service_role.
    await supabaseAdmin().from("audit_logs").insert({
      organization_id: orgId,
      actor_user_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (e) {
    // Auditoría best-effort si service_role no está configurada.
    console.error("[audit]", action, e instanceof Error ? e.message : e);
  }
}

// Devuelve el id de la organización si el usuario autenticado es miembro
// activo; null si no (RLS ya oculta la org, la query extra es por rol).
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

// Los filtros .or() de PostgREST se rompen con ,()". Para búsqueda exacta
// de duplicados basta quitar esos caracteres del valor comparado.
const FILTER_BAD = /[(),"\\]/g;

export async function findDuplicates(
  orgSlug: string,
  phone: string | null,
  email: string | null,
  excludeId?: string,
) {
  const { supabase, orgId } = await requireMembership(orgSlug);
  const clauses: string[] = [];
  const safe = (v: string) => v.replace(FILTER_BAD, "");
  if (phone && safe(phone)) clauses.push(`phone.eq.${safe(phone)}`);
  if (email && safe(email)) clauses.push(`email.eq.${safe(email)}`);
  if (clauses.length === 0) return [];

  let q = supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone")
    .eq("organization_id", orgId)
    .or(clauses.join(","));
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(10);
  return data ?? [];
}

export async function createCustomer(orgSlug: string, formData: FormData) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const { values, errors } = validateCustomerInput(formData);
  const back = `/dashboard/${orgSlug}/customers/new`;

  if (Object.keys(errors).length > 0) {
    redirect(back + "?error=" + encodeURIComponent(Object.values(errors)[0]));
  }

  // Detección de duplicados: sin fusión automática — el staff confirma.
  const confirmed = formData.get("confirm_duplicate") === "on";
  if (!confirmed) {
    const dups = await findDuplicates(orgSlug, values.phone, values.email);
    if (dups.length > 0) {
      redirect(
        back +
          "?dup=" +
          encodeURIComponent(dups.map((d) => d.id).join(",")) +
          "&warn=" +
          encodeURIComponent(
            `Posible duplicado: coincide teléfono/email con ${dups
              .map((d) => `${d.first_name} ${d.last_name ?? ""}`.trim())
              .join(", ")}. Marca "crear de todas formas" para continuar.`,
          ),
      );
    }
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      organization_id: orgId,
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      birth_date: values.birth_date,
      external_ref: values.external_ref,
      // El consentimiento se registra como timestamp separado, no booleano.
      marketing_consent_at: values.marketing_consent ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !customer) {
    const msg =
      error?.code === "23505"
        ? "Ya existe un cliente con esa referencia externa."
        : "No se pudo crear el cliente.";
    redirect(back + "?error=" + encodeURIComponent(msg));
  }

  await audit(orgId, user.id, "customer.created", "customer", customer.id, {
    first_name: values.first_name,
    marketing_consent: values.marketing_consent,
    confirmed_duplicate: confirmed,
  });

  redirect(`/dashboard/${orgSlug}/customers/${customer.id}`);
}

export async function updateCustomer(orgSlug: string, customerId: string, formData: FormData) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);
  const { values, errors } = validateCustomerInput(formData);
  const back = `/dashboard/${orgSlug}/customers/${customerId}`;

  if (Object.keys(errors).length > 0) {
    redirect(back + "?error=" + encodeURIComponent(Object.values(errors)[0]));
  }

  const { error } = await supabase
    .from("customers")
    .update({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      birth_date: values.birth_date,
      external_ref: values.external_ref,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)
    .eq("organization_id", orgId);

  if (error) {
    const msg =
      error.code === "23505"
        ? "Ya existe un cliente con esa referencia externa."
        : "No se pudo actualizar el cliente.";
    redirect(back + "?error=" + encodeURIComponent(msg));
  }

  await audit(orgId, user.id, "customer.updated", "customer", customerId, {
    first_name: values.first_name,
  });
  revalidatePath(back);
  redirect(back + "?ok=" + encodeURIComponent("Cliente actualizado."));
}

// Consentimiento como evento separado con auditoría propia (F3-T6).
export async function setMarketingConsent(orgSlug: string, customerId: string, consent: boolean) {
  const { supabase, user, orgId } = await requireMembership(orgSlug);

  const { error } = await supabase
    .from("customers")
    .update({
      marketing_consent_at: consent ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)
    .eq("organization_id", orgId);

  if (error) {
    redirect(
      `/dashboard/${orgSlug}/customers/${customerId}?error=` +
        encodeURIComponent("No se pudo actualizar el consentimiento."),
    );
  }

  await audit(
    orgId,
    user.id,
    consent ? "customer.consent_granted" : "customer.consent_revoked",
    "customer",
    customerId,
  );
  revalidatePath(`/dashboard/${orgSlug}/customers/${customerId}`);
}
