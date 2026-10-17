// Prueba manual de push de Google Wallet para PineappleLoyalty.
// Replica lib/wallet/passlet.ts + pass-data.ts pero con notify/mensajes.
//
// Uso (desde la raíz del repo):
//   node scripts/wallet-push-test.mjs update <serial>
//   node scripts/wallet-push-test.mjs message <serial> "Título" "Cuerpo"
//
// <serial> = customer_cards.id (el serial_number del pase).
// Lee credenciales de apps/web/.env.local — no imprime secretos.

import { readFileSync } from "node:fs";
import { Wallet, field } from "passlet";

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv("apps/web/.env.local");
const BASE = env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function googleCreds() {
  const json = env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON
    ? JSON.parse(env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON)
    : {};
  const clientEmail = json.client_email;
  const privateKey = env.GOOGLE_WALLET_PRIVATE_KEY ?? json.private_key;
  if (!clientEmail || !privateKey || !env.GOOGLE_WALLET_ISSUER_ID)
    throw new Error("google_wallet_not_configured");
  return { clientEmail, privateKey, issuerId: env.GOOGLE_WALLET_ISSUER_ID };
}

const first = (v) => (Array.isArray(v) ? v[0] ?? null : v ?? null);

async function passDataBySerial(serial) {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/customer_cards?id=eq.${serial}` +
      `&select=id,token,status,organization_id,customer_id,` +
      `customers(first_name),` +
      `loyalty_accounts(program_id,current_stamps,current_points,` +
      `loyalty_programs(name,program_type,stamp_goal)),organizations(name,brand)`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );
  const rows = await res.json();
  const card = rows?.[0];
  if (!card) return null;
  const cust = first(card.customers);
  const acc = first(card.loyalty_accounts);
  const prog = acc ? first(acc.loyalty_programs) : null;
  const org = first(card.organizations);
  const lmRes = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/wallet_passes?serial_number=eq.${serial}` +
      `&select=last_message&order=created_at.desc&limit=1`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );
  const lm = (await lmRes.json())?.[0]?.last_message;
  const hasLogo = !!org?.brand?.logo_url?.startsWith("data:");
  return {
    serialNumber: card.id,
    orgId: card.organization_id,
    orgName: org?.name ?? "Comercio",
    logoUrl: hasLogo ? `${BASE}/logo/${card.organization_id}` : null,
    brandColor:
      typeof org?.brand?.color === "string" && /^#[0-9a-fA-F]{6}$/.test(org.brand.color)
        ? org.brand.color
        : null,
    lastMessage: lm && lm.header && lm.body ? { header: lm.header, body: lm.body } : null,
    firstName: cust?.first_name ?? "Cliente",
    programName: prog?.name ?? "Fidelización",
    stamps:
      prog?.program_type === "stamps"
        ? { current: acc?.current_stamps ?? 0, goal: prog.stamp_goal ?? null }
        : null,
    points: prog?.program_type === "points" ? acc?.current_points ?? 0 : null,
    cardUrl: `${BASE}/t/${card.token}`,
    revoked: card.status !== "active",
  };
}

const gc = googleCreds();
const wallet = new Wallet({
  google: {
    issuerId: gc.issuerId,
    clientEmail: gc.clientEmail,
    privateKey: gc.privateKey,
    origins: [BASE],
  },
  load: async (serial) => {
    const data = await passDataBySerial(serial);
    if (!data) return null;
    const { serialNumber, ...rest } = data;
    void serialNumber;
    return { content: contentOf(rest), template: templateOf(data), updatedAt: new Date() };
  },
});

function templateOf(data) {
  return wallet.loyalty({
    id: `loyalty-${data.orgId}`,
    name: data.programName,
    color: data.brandColor ?? "#0d9488",
    google: {
      issuerName: data.orgName,
      logo: data.logoUrl ?? `${BASE}/brand/wallet-logo.png?v=2`,
    },
    fields: [
      field.secondary("holder", "Cliente"),
      field.secondary("org", "Comercio"),
      field.primary("balance", "Sellos", { changeMessage: "Sellos: %@" }),
      field.primary("points", "Puntos", { changeMessage: "Puntos: %@" }),
    ],
  });
}

function contentOf(data) {
  return {
    values: {
      holder: data.firstName,
      org: data.orgName,
      balance: data.stamps ? `${data.stamps.current}/${data.stamps.goal ?? "?"}` : null,
      points: data.points != null ? String(data.points) : null,
    },
    barcode: { format: "QR", value: data.cardUrl },
    apple: data.revoked ? { voided: true } : undefined,
    google: {
      messages: data.lastMessage
        ? [{ header: data.lastMessage.header, body: data.lastMessage.body, messageType: "TEXT" }]
        : [],
    },
  };
}

const [cmd, serial, header, body] = process.argv.slice(2);
if (!serial) {
  console.error("uso: node scripts/wallet-push-test.mjs <update|message> <serial> [título] [cuerpo]");
  process.exit(1);
}

if (cmd === "update") {
  const data = await passDataBySerial(serial);
  if (!data) {
    console.error("serial no encontrado");
    process.exit(1);
  }
  await templateOf(data).publish();
  console.log("clase publicada:", `loyalty-${data.orgId}`);
  const r = await wallet.update(serial, { notify: true });
  console.log("update →", JSON.stringify(r));
} else if (cmd === "message") {
  const data = await passDataBySerial(serial);
  if (!data) {
    console.error("serial no encontrado");
    process.exit(1);
  }
  const template = templateOf(data);
  await template.publish();
  await template.sendMessage(serial, {
    header: header ?? data.orgName,
    body: body ?? "Tienes novedades en tu tarjeta.",
    messageType: "TEXT_AND_NOTIFY",
  });
  console.log("mensaje enviado (TEXT_AND_NOTIFY)");
  // Persistir último mensaje + colapsar messages[] como hace sendPassMessage.
  await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/wallet_passes?serial_number=eq.${serial}`,
    {
      method: "PATCH",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        last_message: {
          header: header ?? data.orgName,
          body: body ?? "Tienes novedades en tu tarjeta.",
          sent_at: new Date().toISOString(),
        },
      }),
    },
  );
  await wallet.update(serial);
  console.log("messages[] colapsado al último");
} else {
  console.error("comando desconocido:", cmd);
  process.exit(1);
}
