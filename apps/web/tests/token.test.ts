import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCardToken } from "../lib/loyalty/token";

const T = "4ec3c05fc9014d57a45cf45c7864240a";

test("token limpio se conserva", () => {
  assert.equal(normalizeCardToken(T), T);
});

test("código agrupado con espacios (como lo muestra la tarjeta)", () => {
  assert.equal(normalizeCardToken("4ec3 c05f c901 4d57 a45c f45c 7864 240a"), T);
});

test("código con guiones, mayúsculas y espacios alrededor", () => {
  assert.equal(normalizeCardToken("  4EC3-C05F-C901-4D57-A45C-F45C-7864-240A \n"), T);
});

test("URL completa de la tarjeta", () => {
  assert.equal(normalizeCardToken(`https://www.pineappleloyalty.com/t/${T}`), T);
  assert.equal(normalizeCardToken(`http://localhost:3000/t/${T}/escanear?x=1`), T);
});

test("basura no inventa un token válido", () => {
  assert.equal(normalizeCardToken("hola mundo"), "holamundo");
  assert.equal(normalizeCardToken(""), "");
});
