import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

// Rate limit de endpoints públicos caros o con efectos externos (correo,
// push, Google Wallet). Dos capas:
//  1. Postgres (RPC check_rate_limit, ventana fija): compartido entre todas
//     las instancias serverless. Solo lo invoca el servidor con service_role.
//  2. Memoria de la instancia: respaldo si la RPC no existe o falla (la
//     migración aún no aplicada, caída de la base) — nunca "falla cerrado":
//     un error del limitador no debe dejar sin servicio a los clientes.
// Las claves son hashes: ni la IP ni el token salen en claro a la base.

type Bucket = { n: number; reset: number };
const mem = new Map<string, Bucket>();
let dbDownUntil = 0;

function memAllow(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now();
  const b = mem.get(key);
  if (!b || b.reset <= now) {
    if (mem.size > 5000) {
      for (const [k, v] of mem) if (v.reset <= now) mem.delete(k);
    }
    mem.set(key, { n: 1, reset: now + windowSec * 1000 });
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

function hashKey(scope: string, id: string): string {
  return `${scope}:${createHash("sha256").update(id).digest("hex").slice(0, 32)}`;
}

export function clientIp(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function actionIp(): Promise<string> {
  return clientIp(await headers());
}

// true = permitido. `useDb=false` para rutas de altísimo volumen (imágenes).
export async function allow(
  scope: string,
  id: string,
  limit: number,
  windowSec: number,
  useDb = true,
): Promise<boolean> {
  const key = hashKey(scope, id);
  if (useDb && Date.now() >= dbDownUntil) {
    try {
      const { data, error } = await supabaseAdmin().rpc("check_rate_limit", {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSec,
      });
      if (!error && typeof data === "boolean") return data;
      // RPC ausente o con error: no insistir durante un minuto.
      dbDownUntil = Date.now() + 60_000;
    } catch {
      dbDownUntil = Date.now() + 60_000;
    }
  }
  return memAllow(key, limit, windowSec);
}

export function tooMany(retryAfterSec: number): Response {
  return new Response("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", {
    status: 429,
    headers: { "Retry-After": String(retryAfterSec), "Cache-Control": "no-store" },
  });
}

// Route handlers: devuelve la respuesta 429 si se excedió, o null si sigue.
export async function limitRequest(
  req: Request,
  scope: string,
  extraId: string,
  limit: number,
  windowSec: number,
  useDb = true,
): Promise<Response | null> {
  const ok = await allow(scope, `${extraId}|${clientIp(req.headers)}`, limit, windowSec, useDb);
  return ok ? null : tooMany(windowSec);
}

// Server actions (sin Request): lee la IP de las cabeceras de la petición.
export async function allowAction(
  scope: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  return allow(scope, clientIp(await headers()), limit, windowSec);
}
