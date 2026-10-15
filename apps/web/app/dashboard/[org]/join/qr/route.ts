import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

// PNG del QR de autorregistro para imprimir. Requiere sesión (es una vista
// del dashboard); el QR solo codifica la URL pública /join/{token}.
export async function GET(_req: Request, ctx: { params: Promise<{ org: string }> }) {
  const { org: slug } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, join_token")
    .eq("slug", slug)
    .maybeSingle();
  if (!org?.join_token) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const png = await QRCode.toBuffer(`${baseUrl}/join/${org.join_token}`, {
    width: 520,
    margin: 2,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=60",
    },
  });
}
