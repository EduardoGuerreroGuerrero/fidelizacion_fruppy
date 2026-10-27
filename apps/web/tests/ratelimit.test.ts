import { test } from "node:test";
import assert from "node:assert/strict";
import { allow, tooMany } from "../lib/ratelimit";
import { cardImageUrlFor } from "../lib/wallet/images";

test("el limitador en memoria bloquea al pasar el límite y es por clave", async () => {
  const id = `t-${Math.random()}`;
  assert.equal(await allow("scope", id, 2, 60, false), true);
  assert.equal(await allow("scope", id, 2, 60, false), true);
  assert.equal(await allow("scope", id, 2, 60, false), false);
  assert.equal(await allow("scope", `${id}-otro`, 2, 60, false), true);
  assert.equal(await allow("otro-scope", id, 2, 60, false), true);
});

test("tooMany responde 429 con Retry-After", () => {
  const r = tooMany(120);
  assert.equal(r.status, 429);
  assert.equal(r.headers.get("Retry-After"), "120");
});

const base = {
  serialNumber: "fa1ce000-0000-4000-8000-0000000000f1",
  firstName: "Ana",
  stamps: null,
  points: 180,
  revoked: false,
  brandColor: "#0f5132",
  nextReward: { name: "Café", cost: 250, ready: false },
};

test("la URL de la imagen de saldo es determinista y cambia con el saldo", () => {
  const a = cardImageUrlFor("https://x.test", base, "hero");
  assert.equal(a, cardImageUrlFor("https://x.test", base, "hero"));
  assert.notEqual(a, cardImageUrlFor("https://x.test", { ...base, points: 190 }, "hero"));
  assert.notEqual(a, cardImageUrlFor("https://x.test", base, "full"));
});

test("el parámetro v no depende del origen", () => {
  const v = (o: string) => new URL(cardImageUrlFor(o, base, "full")).searchParams.get("v");
  assert.equal(v("https://a.test"), v("https://b.test"));
});
