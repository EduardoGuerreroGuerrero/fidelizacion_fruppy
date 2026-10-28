import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { antibotEnabled, verifyAntiBot } from "../lib/antibot";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
});

function enable() {
  process.env.TURNSTILE_SECRET_KEY = "secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
}

function form(token?: string) {
  const f = new FormData();
  if (token !== undefined) f.set("cf-turnstile-response", token);
  return f;
}

test("sin claves es un no-op y deja pasar", async () => {
  assert.equal(antibotEnabled(), false);
  assert.deepEqual(await verifyAntiBot(form()), { ok: true });
});

test("con claves y sin token bloquea sin llamar a Cloudflare", async () => {
  enable();
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response("{}");
  }) as typeof fetch;
  assert.deepEqual(await verifyAntiBot(form()), { ok: false, reason: "missing" });
  assert.equal(called, false);
});

test("token válido según Cloudflare pasa y envía secreto, token e IP", async () => {
  enable();
  let sent: URLSearchParams | null = null;
  globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
    sent = init?.body as URLSearchParams;
    return new Response(JSON.stringify({ success: true }));
  }) as typeof fetch;
  assert.deepEqual(await verifyAntiBot(form("tok"), "1.2.3.4"), { ok: true });
  assert.equal(sent!.get("secret"), "secret");
  assert.equal(sent!.get("response"), "tok");
  assert.equal(sent!.get("remoteip"), "1.2.3.4");
});

test("token rechazado por Cloudflare bloquea", async () => {
  enable();
  globalThis.fetch = (async () => new Response(JSON.stringify({ success: false }))) as typeof fetch;
  assert.deepEqual(await verifyAntiBot(form("tok")), { ok: false, reason: "failed" });
});

test("Cloudflare caído → falla abierta (no deja fuera a los clientes)", async () => {
  enable();
  globalThis.fetch = (async () => {
    throw new Error("network");
  }) as typeof fetch;
  assert.deepEqual(await verifyAntiBot(form("tok")), { ok: true });
});

test("respuesta HTTP de error de Cloudflare → falla abierta", async () => {
  enable();
  globalThis.fetch = (async () => new Response("x", { status: 500 })) as typeof fetch;
  assert.deepEqual(await verifyAntiBot(form("tok")), { ok: true });
});
