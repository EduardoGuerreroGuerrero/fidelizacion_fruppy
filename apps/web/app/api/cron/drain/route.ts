import { NextResponse } from "next/server";
import { optionalEnv } from "@/lib/env";
import { drainEmailOutbox } from "@/lib/email/outbox";
import { processPushQueue } from "@/lib/push/send";

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

  return NextResponse.json({ ok: true, email, push });
}
