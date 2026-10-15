"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

// Logo del comercio: PNG con transparencia, guardado como data URI en
// organizations.brand.logo_url (mismo formato que ya usan las orgs sembradas).
// Sin bucket de Storage el data URI evita infra extra; el límite mantiene la
// fila de la org razonablemente liviana.
const MAX_LOGO_BYTES = 256 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

async function logoToDataUri(file: File): Promise<string | null> {
  if (file.size === 0) return null;
  if (file.type !== "image/png" || file.size > MAX_LOGO_BYTES) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  if (!PNG_MAGIC.every((b, i) => buf[i] === b)) return null;
  return `data:image/png;base64,${buf.toString("base64")}`;
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
          "El logo debe ser un PNG sin fondo de máximo 256 KB.",
        ),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      ...(logoUrl ? { brand: { logo_url: logoUrl } } : {}),
    })
    .select("id")
    .single();

  if (orgError || !org) {
    redirect(
      "/dashboard/new?error=" +
        encodeURIComponent(
          orgError?.code === "23505"
            ? "Ya existe una organización con un nombre similar."
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
