import { test } from "node:test";
import assert from "node:assert/strict";
import { optionalEnv, requireEnv } from "../lib/env";

test("requireEnv returns the value when the variable is set", () => {
  process.env.PL_TEST_TEST_VAR = "hello";
  assert.equal(requireEnv("PL_TEST_TEST_VAR"), "hello");
  delete process.env.PL_TEST_TEST_VAR;
});

test("requireEnv throws with the variable name when missing", () => {
  delete process.env.PL_TEST_MISSING_VAR;
  assert.throws(() => requireEnv("PL_TEST_MISSING_VAR"), /PL_TEST_MISSING_VAR/);
});

test("requireEnv throws when the variable is empty", () => {
  process.env.PL_TEST_EMPTY_VAR = "";
  assert.throws(() => requireEnv("PL_TEST_EMPTY_VAR"), /PL_TEST_EMPTY_VAR/);
  delete process.env.PL_TEST_EMPTY_VAR;
});

test("optionalEnv returns undefined for missing or empty vars", () => {
  delete process.env.PL_TEST_OPT_VAR;
  assert.equal(optionalEnv("PL_TEST_OPT_VAR"), undefined);
  process.env.PL_TEST_OPT_VAR = "";
  assert.equal(optionalEnv("PL_TEST_OPT_VAR"), undefined);
  process.env.PL_TEST_OPT_VAR = "x";
  assert.equal(optionalEnv("PL_TEST_OPT_VAR"), "x");
  delete process.env.PL_TEST_OPT_VAR;
});
