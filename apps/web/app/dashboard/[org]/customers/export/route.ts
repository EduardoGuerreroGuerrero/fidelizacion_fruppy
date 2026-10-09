import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Anti CSV-formula-injection: celdas que empiezan por =, +, -, @ o control
// van prefijadas con comilla simple (OWASP CSV Injection).
function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(_req: Request, ctx: { params: Promise<{ org: string }> }) {
  const { org: slug } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // RLS + comprobación de membresía activa.
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Nota: el select debe ser literal — supabase-js lo parsea a nivel de tipos;
  // concatenar strings convierte el resultado en GenericStringError.
  const { data: customers, error } = await supabase
    .from("customers")
    .select(
      "first_name,last_name,email,phone,birth_date,external_ref,status,marketing_consent_at,created_at",
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "export_failed" }, { status: 500 });

  const header =
    "first_name,last_name,email,phone,birth_date,external_ref," +
    "status,marketing_consent_at,created_at";
  const rows = (customers ?? []).map((c) =>
    [
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.birth_date,
      c.external_ref,
      c.status,
      c.marketing_consent_at,
      c.created_at,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [header, ...rows].join("\r\n") + "\r\n";

  // Auditoría de exportación vía RPC (actor = auth.uid(), sin service_role).
  try {
    await supabase.rpc("write_audit_log", {
      p_org: org.id,
      p_action: "customers.exported",
      p_entity_type: "customer",
      p_entity_id: null,
      p_metadata: { count: rows.length, role: membership?.role },
    });
  } catch {
    // auditoría best-effort — no bloquea la descarga
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
