import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";

// Logo público del comercio por id de organización (opaco, sin PII) — único
// dato expuesto es brand.logo_url, ya visible en el QR/join público. Esta
// ruta existe porque Google/Apple Wallet exigen una URL https real para el
// logo del pase; el valor guardado puede ser un data: URI (PNG subido) que
// esos proveedores no pueden resolver directamente.
export async function GET(_req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await ctx.params;
  const { data: org } = await supabaseAdmin()
    .from("organizations")
    .select("brand")
    .eq("id", orgId)
    .maybeSingle();
  const logoUrl = (org?.brand as { logo_url?: string } | null)?.logo_url;
  if (!logoUrl) notFound();

  if (logoUrl.startsWith("data:image/png;base64,")) {
    const base64 = logoUrl.slice("data:image/png;base64,".length);
    const buf = Buffer.from(base64, "base64");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (/^https:\/\//.test(logoUrl)) redirect(logoUrl);
  notFound();
}
