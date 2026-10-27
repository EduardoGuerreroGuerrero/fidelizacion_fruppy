import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { limitRequest } from "@/lib/ratelimit";

// Envío de solicitud de derechos del titular. El token de la tarjeta es la
// credencial; la RPC impone antiabuso (máx. 5 abiertas) y valida el tipo.
const TYPES = new Set(["access", "rectification", "erasure", "revocation", "complaint"]);

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  // Origen de la petición (no NEXT_PUBLIC_BASE_URL): local y previews no saltan a producción.
  const baseUrl = new URL(req.url).origin;
  const back = `${baseUrl}/t/${token}/perfil/derechos`;

  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.redirect(back, 303);
  }
  const limited = await limitRequest(req, "rights", token, 10, 3600);
  if (limited) return limited;

  const form = await req.formData().catch(() => null);
  const type = String(form?.get("type") ?? "");
  const detail = String(form?.get("detail") ?? "").trim().slice(0, 2000) || null;
  if (!form || !TYPES.has(type)) {
    return NextResponse.redirect(back, 303);
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("submit_rights_request", {
    p_token: token,
    p_request_type: type,
    p_detail: detail,
  });
  const r = data as { ok?: boolean; error?: string } | null;

  if (!r?.ok) {
    const msg =
      r?.error === "rate_limited"
        ? "Ya tienes varias solicitudes abiertas. Espera la respuesta."
        : "No se pudo enviar la solicitud. Inténtalo de nuevo.";
    return NextResponse.redirect(back + "?error=" + encodeURIComponent(msg), 303);
  }

  return NextResponse.redirect(back + "?enviado=1", 303);
}
