import { NextResponse } from "next/server";
import { optionalEnv } from "@/lib/env";
import { drainEmailOutbox } from "@/lib/email/outbox";
import { processPushQueue } from "@/lib/push/send";
import { supabaseAdmin } from "@/lib/supabase/server";

// Drenaje periódico de colas (Vercel Cron o job externo): correo
// transaccional + envíos push. Protegido por CRON_SECRET (Bearer); Vercel
// lo envía automáticamente en la cabecera Authorization del cron.
// En desarrollo sin CRON_SECRET se permite la llamada manual.
export async function GET(req: Request) {
  const secret = optionalEnv("CRON_SECRET");
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  }

  const email = await drainEmailOutbox(25).catch((e) => {
    console.error("[cron] email drain failed:", e instanceof Error ? e.message : e);
    return { sent: 0, failed: 0 };
  });
  const push = await processPushQueue(50).catch((e) => {
    console.error("[cron] push drain failed:", e instanceof Error ? e.message : e);
    return { sent: 0, failed: 0, expired: 0, skipped: 0 };
  });

  // Intentos de alta por QR con más de un día: ya no cuentan para el límite
  // (la RPC solo mira la última hora). Se limpian aquí y no en cada alta.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin()
    .from("join_attempts")
    .delete()
    .lt("created_at", cutoff)
    .then(({ error }) => {
      if (error) console.error("[cron] join_attempts cleanup failed:", error.code);
    });

  // Ventanas del limitador con más de un día.
  await supabaseAdmin()
    .from("rate_limits")
    .delete()
    .lt("window_start", cutoff)
    .then(({ error }) => {
      // 42P01/PGRST205: tabla aún no creada (migración pendiente) → sin ruido.
      if (error && !["42P01", "PGRST205"].includes(error.code)) {
        console.error("[cron] rate_limits cleanup failed:", error.code);
      }
    });

  return NextResponse.json({ ok: true, email, push });
}
