import { test } from "node:test";
import assert from "node:assert/strict";
import { PassletWalletProvider } from "../lib/wallet/passlet";
import { WalletNotConfiguredError } from "../lib/wallet/provider";

// Sin credenciales en entorno: el provider debe reportarse no configurado
// y lanzar WalletNotConfiguredError — nunca silencioso ni fake-success.

const WALLET_ENV = [
  "APPLE_WALLET_ENABLED",
  "APPLE_PASS_TYPE_ID",
  "APPLE_TEAM_ID",
  "APPLE_WWDR_CERT_PATH",
  "APPLE_PASS_CERT_PATH",
  "APPLE_PASS_KEY_PATH",
  "APPLE_WWDR_PEM",
  "APPLE_PASS_CERT_PEM",
  "APPLE_PASS_KEY_PEM",
  "GOOGLE_WALLET_ENABLED",
  "GOOGLE_WALLET_ISSUER_ID",
  "GOOGLE_WALLET_PRIVATE_KEY",
  "GOOGLE_WALLET_SERVICE_ACCOUNT_JSON",
  "GOOGLE_APPLICATION_CREDENTIALS",
];

function clearWalletEnv() {
  const saved: Record<string, string | undefined> = {};
  for (const k of WALLET_ENV) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  return () => {
    for (const k of WALLET_ENV)
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
  };
}

test("provider no configurado sin credenciales", async () => {
  const restore = clearWalletEnv();
  try {
    const p = new PassletWalletProvider();
    assert.equal(p.configured(), false);
    const h = await p.healthCheck();
    assert.equal(h.ok, false);
    assert.equal(h.detail, "wallet_not_configured");
  } finally {
    restore();
  }
});

test("issuePass lanza WalletNotConfiguredError sin credenciales", async () => {
  const restore = clearWalletEnv();
  try {
    const p = new PassletWalletProvider();
    await assert.rejects(
      () =>
        p.issuePass(
          {
            serialNumber: "s1",
            orgName: "Org",
            firstName: "Ana",
            programName: "Café",
            stamps: { current: 3, goal: 9 },
            points: null,
            cardUrl: "https://x/t/tok",
            revoked: false,
          },
          async () => null,
        ),
      WalletNotConfiguredError,
    );
  } finally {
    restore();
  }
});

test("solo Apple habilitado pero sin certs → no configurado", () => {
  const restore = clearWalletEnv();
  try {
    process.env.APPLE_WALLET_ENABLED = "true";
    process.env.APPLE_PASS_TYPE_ID = "pass.com.test";
    process.env.APPLE_TEAM_ID = "TEAM123456";
    const p = new PassletWalletProvider();
    assert.equal(p.configured(), false);
  } finally {
    restore();
  }
});
