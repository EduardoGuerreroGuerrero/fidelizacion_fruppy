import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Consentimiento del cliente (tratamiento de datos + publicidad). Ruta
// pública: el token de la tarjeta es la credencial; la RPC es idempotente y
// solo registra la primera vez. El checkbox de datos es `required` en el
// form — si llega sin él, simplemente se vuelve a la tarjeta sin escribir.
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  // Origen de la petición (no NEXT_PUBLIC_BASE_URL): local y previews no saltan a producción.
  const baseUrl = new URL(req.url).origin;
  const back = `${baseUrl}/t/${token}`;

  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.redirect(back, 303);
  }

  // POST vacío o sin content-type de formulario → no hay consentimiento.
  const form = await req.formData().catch(() => null);
  if (!form || form.get("data_consent") !== "on") {
    return NextResponse.redirect(back, 303);
  }

  const supabase = await createClient();
  await supabase.rpc("record_card_consent", {
    p_token: token,
    p_marketing: form.get("marketing_consent") === "on",
  });

  return NextResponse.redirect(back, 303);
}
