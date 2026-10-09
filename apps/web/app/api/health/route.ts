import { env } from "@/lib/env";

// Public, non-sensitive health endpoint. No secrets, no internal state.
// Route Handlers are not cached by default (Next.js 16).
export async function GET() {
  return Response.json({
    status: "ok",
    service: "fruppy-web",
    env: env.appEnv,
    timestamp: new Date().toISOString(),
  });
}
