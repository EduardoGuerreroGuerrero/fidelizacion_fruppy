import { test } from "node:test";
import assert from "node:assert/strict";
import { brandVars } from "../lib/brand";

test("sin color o inválido no toca el tema", () => {
  assert.equal(brandVars(undefined), undefined);
  assert.equal(brandVars(null), undefined);
  assert.equal(brandVars("rojo"), undefined);
  assert.equal(brandVars("#12345"), undefined);
  assert.equal(brandVars("javascript:alert(1)"), undefined);
});

test("color válido: base + variantes oscura/profunda/suave", () => {
  const v = brandVars("#7c2d12") as Record<string, string>;
  assert.equal(v["--color-brand"], "#7c2d12");
  assert.match(v["--color-brand-dark"], /^#[0-9a-f]{6}$/);
  assert.match(v["--color-brand-deeper"], /^#[0-9a-f]{6}$/);
  assert.match(v["--color-brand-soft"], /^#[0-9a-f]{6}$/);
  // dark más oscuro que base; soft más claro
  const lum = (h: string) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
  assert.ok(lum(v["--color-brand-dark"]) < lum(v["--color-brand"]));
  assert.ok(lum(v["--color-brand-deeper"]) < lum(v["--color-brand-dark"]));
  assert.ok(lum(v["--color-brand-soft"]) > lum(v["--color-brand"]));
});
