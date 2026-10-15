import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Suscripción/baja de push del cliente para SU comercio. El token de la
// tarjeta es la credencial; la RPC valida el flag de la org y registra la
// autorización comercial como evento de consentimiento separado de la
// suscripción técnica.
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
  }

  let body: {
    action?: string;
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const supabase = await createClient();

  if (body.action === "subscribe") {
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ ok: false, error: "invalid_subscription" }, { status: 400 });
    }
    const { data } = await supabase.rpc("upsert_push_subscription", {
      p_card_token: token,
      p_endpoint: body.endpoint,
      p_p256dh: body.keys.p256dh,
      p_auth: body.keys.auth,
      p_user_agent: req.headers.get("user-agent"),
    });
    const r = data as { ok?: boolean; error?: string } | null;
    return NextResponse.json(r ?? { ok: false, error: "unexpected" });
  }

  if (body.action === "unsubscribe") {
    if (!body.endpoint) {
      return NextResponse.json({ ok: false, error: "invalid_subscription" }, { status: 400 });
    }
    const { data } = await supabase.rpc("revoke_push_subscription", {
      p_card_token: token,
      p_endpoint: body.endpoint,
    });
    const r = data as { ok?: boolean; error?: string } | null;
    return NextResponse.json(r ?? { ok: false, error: "unexpected" });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
