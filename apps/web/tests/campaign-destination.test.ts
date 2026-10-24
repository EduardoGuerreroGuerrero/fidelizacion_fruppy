import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCampaignUrl, scheduleToDate } from "../lib/push/destination";

test("sin enlace abre la tarjeta del cliente", () => {
  assert.equal(resolveCampaignUrl(null, "abc"), "/t/abc");
  assert.equal(resolveCampaignUrl("/", "abc"), "/t/abc");
});

test("prefija rutas internas con el token del destinatario", () => {
  assert.equal(resolveCampaignUrl("/promociones", "abc"), "/t/abc/promociones");
});

test("respeta /t/ y https", () => {
  assert.equal(resolveCampaignUrl("/t/xyz/bonos", "abc"), "/t/xyz/bonos");
  assert.equal(resolveCampaignUrl("https://ejemplo.com/x", "abc"), "https://ejemplo.com/x");
});

test("sin token cae a la raíz", () => {
  assert.equal(resolveCampaignUrl("/promociones", null), "/");
});

test("hora local → UTC con el offset del navegador (Bogotá = 300)", () => {
  assert.equal(scheduleToDate("2026-10-22T09:00", 300).toISOString(), "2026-10-22T14:00:00.000Z");
});

test("entrada inválida da fecha inválida", () => {
  assert.ok(Number.isNaN(scheduleToDate("", 0).getTime()));
});
