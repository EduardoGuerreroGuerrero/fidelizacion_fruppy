import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// La variante `dark:` está neutralizada (globals.css) y el panel es siempre
// claro: una clase `dark:` nueva volvería a pintar fichas oscuras ilegibles.
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

test("ningún componente usa clases dark:", () => {
  const offenders = walk("app").filter((f) => /\bdark:[a-z[]/.test(readFileSync(f, "utf8")));
  assert.deepEqual(offenders, []);
});
