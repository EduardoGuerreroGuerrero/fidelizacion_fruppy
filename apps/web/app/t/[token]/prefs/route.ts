import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Centro de preferencias del cliente (formulario clásico, sin JS):
// alterna consentimientos por canal. El token de la tarjeta es la
// credencial; cada cambio queda como evento auditable.
const PURPOSES = new Set(["marketing_email", "location"]);

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  // Origen de la petición (no NEXT_PUBLIC_BASE_URL): local y previews no saltan a producción.
  const baseUrl = new URL(req.url).origin;
  const back = `${baseUrl}/t/${token}/perfil/notificaciones`;

  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.redirect(back, 303);
  }

  const form = await req.formData().catch(() => null);
  const purpose = String(form?.get("purpose") ?? "");
  if (!form || !PURPOSES.has(purpose)) {
    return NextResponse.redirect(back, 303);
  }

  const supabase = await createClient();
  await supabase.rpc("set_card_consent", {
    p_token: token,
    p_purpose: purpose,
    p_granted: form.get("granted") === "1",
  });

  return NextResponse.redirect(back, 303);
}
