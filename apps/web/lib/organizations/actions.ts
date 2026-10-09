"use server";

import { redirect } from "next/navigation";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
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
    await supabaseAdmin()
      .from("audit_logs")
      .insert({
        organization_id: orgId,
        actor_user_id: actorId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
      });
  } catch (e) {
    // Auditoría best-effort en dev si service_role no está configurada.
    console.error("[audit]", action, e instanceof Error ? e.message : e);
  }
}

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim().toLowerCase();
  const slug = slugInput || slugify(name);

  if (name.length < 2 || name.length > 120) {
    redirect("/dashboard/new?error=" + encodeURIComponent("Nombre inválido."));
  }
  if (!SLUG_RE.test(slug)) {
    redirect(
      "/dashboard/new?error=" +
        encodeURIComponent("Slug inválido (minúsculas, números y guiones)."),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug })
    .select("id")
    .single();

  if (orgError || !org) {
    redirect(
      "/dashboard/new?error=" +
        encodeURIComponent(
          orgError?.code === "23505"
            ? "Ese slug ya está en uso."
            : "No se pudo crear la organización.",
        ),
    );
  }

  // Membresía de owner: la policy permite autoinsertarse como owner en una org nueva.
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: user.id, role: "owner" });

  if (memberError) {
    // La org quedó creada pero sin owner: estado inconsistente — reportar.
    console.error("[createOrganization] membership failed", memberError.message);
    redirect(
      "/dashboard/new?error=" +
        encodeURIComponent("La organización se creó pero falló la membresía."),
    );
  }

  await audit(org.id, user.id, "organization.created", "organization", org.id, {
    name,
    slug,
  });

  redirect("/dashboard");
}
