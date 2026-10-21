"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoToDataUri } from "./logo";

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

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(name);
  const logoFile = formData.get("logo");

  if (name.length < 2 || name.length > 120 || !SLUG_RE.test(slug)) {
    redirect("/dashboard/new?error=" + encodeURIComponent("Nombre inválido."));
  }

  const logoUrl =
    logoFile instanceof File ? await logoToDataUri(logoFile) : null;
  if (logoFile instanceof File && logoFile.size > 0 && !logoUrl) {
    redirect(
      "/dashboard/new?error=" +
        encodeURIComponent(
          "No se pudo usar ese archivo como logo: debe ser una imagen (PNG, JPG, WebP o SVG) de máximo 10 MB.",
        ),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Org + membresía owner en UNA transacción (RPC security definer): un
  // insert directo + select fallaba por RLS (aún no eras miembro).
  const { data: orgId, error: orgError } = await supabase.rpc(
    "create_organization",
    { p_name: name, p_slug: slug, p_brand: logoUrl ? { logo_url: logoUrl } : {} },
  );

  if (orgError || !orgId) {
    console.error("[createOrganization]", orgError?.code, orgError?.message);
    redirect(
      "/dashboard/new?error=" +
        encodeURIComponent(
          orgError?.code === "23505"
            ? "Ya existe una organización con un nombre similar."
            : orgError?.message?.includes("org_limit")
              ? "Alcanzaste el máximo de organizaciones por cuenta."
              : "No se pudo crear la organización.",
        ),
    );
  }

  await audit(orgId, user.id, "organization.created", "organization", orgId, {
    name,
    slug,
  });

  redirect("/dashboard");
}
