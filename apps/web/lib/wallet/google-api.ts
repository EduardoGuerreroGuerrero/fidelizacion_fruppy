import { createSign } from "node:crypto";

// Cliente mínimo de la API REST de Google Wallet. passlet no deja fijar una
// imagen principal (heroImage) POR pase en tarjetas de fidelización, y esa
// imagen es la que ocupa el frente de la tarjeta: aquí se parchea el objeto
// directamente. Solo servidor; las credenciales salen del entorno.

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

let cached: { token: string; exp: number } | null = null;

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

async function accessToken(creds: { clientEmail: string; privateKey: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 60 > now) return cached.token;
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: creds.clientEmail,
    scope: SCOPE,
    aud: TOKEN_URI,
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(creds.privateKey, "base64url");
  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sig}`,
    }),
  });
  if (!res.ok) throw new Error(`google_token_${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

// Imagen principal (frente de la tarjeta) de UN objeto de fidelización.
export async function patchLoyaltyObjectHero(
  creds: { clientEmail: string; privateKey: string },
  issuerId: string,
  serial: string,
  heroUrl: string,
): Promise<void> {
  const token = await accessToken(creds);
  const res = await fetch(`${API}/loyaltyObject/${issuerId}.${serial}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ heroImage: { sourceUri: { uri: heroUrl } } }),
  });
  if (!res.ok) throw new Error(`google_patch_${res.status}`);
}
