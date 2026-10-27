import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase/server";
import { safeBrand } from "@/lib/wallet/images";
import { limitRequest } from "@/lib/ratelimit";

// Banner del pase de Google Wallet (1032×336, proporción que pide Google):
// color del comercio, onda decorativa y su nombre — misma identidad que la
// tarjeta de la app. Solo muestra el nombre del comercio y del programa.
export async function GET(req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(orgId)) return new Response("not found", { status: 404 });

  const limited = await limitRequest(req, "wallet-img", "hero", 120, 60, false);
  if (limited) return limited;

  const { data: org } = await supabaseAdmin()
    .from("organizations")
    .select("name, brand")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return new Response("not found", { status: 404 });

  const { data: program } = await supabaseAdmin()
    .from("loyalty_programs")
    .select("name")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const color = safeBrand((org.brand as { color?: string } | null)?.color);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: color,
          color: "white",
          padding: "0 64px 56px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -110,
            top: -190,
            width: 520,
            height: 520,
            borderRadius: 520,
            background: "rgba(255,255,255,0.10)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -80,
            bottom: -150,
            width: 380,
            height: 380,
            borderRadius: 380,
            background: "rgba(255,255,255,0.07)",
            display: "flex",
          }}
        />
        <div style={{ fontSize: 76, lineHeight: 1.05, display: "flex", maxWidth: 900 }}>{org.name}</div>
        {program?.name ? (
          <div style={{ fontSize: 34, marginTop: 10, opacity: 0.8, display: "flex" }}>{program.name}</div>
        ) : null}
      </div>
    ),
    {
      width: 1032,
      height: 336,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
