import { test } from "node:test";
import assert from "node:assert/strict";
import { optionalEnv, requireEnv } from "../lib/env";

test("requireEnv returns the value when the variable is set", () => {
  process.env.FRUPPY_TEST_VAR = "hello";
  assert.equal(requireEnv("FRUPPY_TEST_VAR"), "hello");
  delete process.env.FRUPPY_TEST_VAR;
});

test("requireEnv throws with the variable name when missing", () => {
  delete process.env.FRUPPY_MISSING_VAR;
  assert.throws(() => requireEnv("FRUPPY_MISSING_VAR"), /FRUPPY_MISSING_VAR/);
});

test("requireEnv throws when the variable is empty", () => {
  process.env.FRUPPY_EMPTY_VAR = "";
  assert.throws(() => requireEnv("FRUPPY_EMPTY_VAR"), /FRUPPY_EMPTY_VAR/);
  delete process.env.FRUPPY_EMPTY_VAR;
});

test("optionalEnv returns undefined for missing or empty vars", () => {
  delete process.env.FRUPPY_OPT_VAR;
  assert.equal(optionalEnv("FRUPPY_OPT_VAR"), undefined);
  process.env.FRUPPY_OPT_VAR = "";
  assert.equal(optionalEnv("FRUPPY_OPT_VAR"), undefined);
  process.env.FRUPPY_OPT_VAR = "x";
  assert.equal(optionalEnv("FRUPPY_OPT_VAR"), "x");
  delete process.env.FRUPPY_OPT_VAR;
});
