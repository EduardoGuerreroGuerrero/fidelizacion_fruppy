import { test } from "node:test";
import assert from "node:assert/strict";
import { programTypeLabel, reasonLabel, roleLabel, statusLabel, visitSourceLabel } from "../lib/labels";

test("etiquetas conocidas en español", () => {
  assert.equal(programTypeLabel("stamps"), "Sellos");
  assert.equal(statusLabel("active"), "Activo");
  assert.equal(roleLabel("manager"), "Encargado");
  assert.equal(visitSourceLabel("staff_qr"), "escaneo con QR");
});

test("valores desconocidos se muestran tal cual (no se pierden)", () => {
  assert.equal(statusLabel("raro"), "raro");
  assert.equal(roleLabel("x"), "x");
});

test("el motivo del ledger no filtra claves ni ids internos", () => {
  assert.equal(reasonLabel("qr_scan"), "escaneo de QR");
  assert.equal(reasonLabel("redemption:5b3d2aee-db8f-4e52-88ec-a4d8d2fcae95"), "canje de recompensa");
  assert.equal(reasonLabel(null), null);
  assert.equal(reasonLabel("Corrección manual"), "Corrección manual");
});
