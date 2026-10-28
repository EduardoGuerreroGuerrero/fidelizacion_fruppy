import { optionalEnv } from "@/lib/env";

// Anti-bot de formularios públicos con Cloudflare Turnstile.
//
// Se activa SOLO si hay claves en el entorno:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY (cliente) y TURNSTILE_SECRET_KEY (servidor).
// Sin ellas todo es un no-op (desarrollo, previews, o antes de crear el
// widget). Con ellas, el servidor valida el token en cada envío:
//   - token ausente o rechazado por Cloudflare → se bloquea;
//   - Cloudflare caído o sin respuesta → se deja pasar (falla abierta): el
//     rate limit y el honeypot siguen protegiendo y los clientes reales no
//     se quedan fuera por una caída de un tercero.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type AntiBotResult = { ok: true } | { ok: false; reason: "missing" | "failed" };

export function antibotEnabled(): boolean {
  return !!optionalEnv("TURNSTILE_SECRET_KEY") && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export const ANTIBOT_MESSAGE =
  "No pudimos verificar que eres una persona. Recarga la página, completa la verificación e inténtalo de nuevo.";

export async function verifyAntiBot(
  formData: FormData | null,
  ip?: string | null,
): Promise<AntiBotResult> {
  if (!antibotEnabled()) return { ok: true };

  const token = String(formData?.get("cf-turnstile-response") ?? "").trim();
  if (!token || token.length > 2048) return { ok: false, reason: "missing" };

  try {
    const body = new URLSearchParams({
      secret: optionalEnv("TURNSTILE_SECRET_KEY")!,
      response: token,
    });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`siteverify_${res.status}`);
    const json = (await res.json()) as { success?: boolean };
    return json.success === true ? { ok: true } : { ok: false, reason: "failed" };
  } catch (e) {
    console.error("[antibot] verificación no disponible, se permite:", e instanceof Error ? e.message : e);
    return { ok: true };
  }
}
