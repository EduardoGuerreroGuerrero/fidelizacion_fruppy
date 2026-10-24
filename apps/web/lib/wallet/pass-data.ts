import { supabaseAdmin } from "@/lib/supabase/server";
import { publicLogoUrl } from "@/lib/organizations/logo";
import type { WalletPassData } from "./provider";
import { toWalletLocations } from "./locations";

// Carga del pase desde la DB (fuente de verdad) para emisión y updates.
// Usa service_role: el token de la tarjeta ES la credencial pública, y los
// updates por serial llegan desde callbacks internos de passlet.

const SELECT =
  "id, token, status, organization_id, customer_id, customers(first_name), " +
  "loyalty_accounts(program_id, current_stamps, current_points, loyalty_programs(name, program_type, stamp_goal)), " +
  "organizations(name, brand, features)";

type CardRow = {
  id: string;
  token: string;
  status: string;
  organization_id: string;
  customer_id: string;
  customers: { first_name: string } | { first_name: string }[] | null;
  loyalty_accounts:
    | {
        program_id: string;
        current_stamps: number;
        current_points: number;
        loyalty_programs:
          | { name: string; program_type: string; stamp_goal: number | null }
          | { name: string; program_type: string; stamp_goal: number | null }[]
          | null;
      }
    | {
        program_id: string;
        current_stamps: number;
        current_points: number;
        loyalty_programs:
          | { name: string; program_type: string; stamp_goal: number | null }
          | { name: string; program_type: string; stamp_goal: number | null }[]
          | null;
      }[]
    | null;
  organizations:
    | OrgRow
    | OrgRow[]
    | null;
};

type OrgRow = {
  name: string;
  brand: { logo_url?: string; color?: string } | null;
  features: Record<string, unknown> | null;
};

const first = <T>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

async function lastMessageBySerial(
  serial: string,
): Promise<{ header: string; body: string } | null> {
  const { data } = await supabaseAdmin()
    .from("wallet_passes")
    .select("last_message")
    .eq("serial_number", serial)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const m = data?.last_message as { header?: string; body?: string } | null;
  return m && m.header && m.body ? { header: m.header, body: m.body } : null;
}

// Sedes de la organización para la clase de Wallet. Solo si el comercio activó
// la proximidad (features.wallet_proximity) — desactivada por defecto.
export async function walletLocationsOf(
  orgId: string,
  orgName: string,
  features: Record<string, unknown> | null,
): Promise<WalletPassData["locations"]> {
  if (features?.wallet_proximity !== true) return [];
  const { data } = await supabaseAdmin()
    .from("locations")
    .select("name, lat, lng, status")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("created_at");
  return toWalletLocations(data ?? [], orgName).locations;
}

async function toPassData(card: CardRow): Promise<WalletPassData> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cust = first(card.customers);
  const acc = first(card.loyalty_accounts);
  const prog = acc ? first(acc.loyalty_programs) : null;
  const org = first(card.organizations);
  // Solo vale como logo un data: URI (PNG subido por Settings). Cualquier
  // otra cosa — p. ej. la URL del sitio web del comercio — no es una imagen
  // y Google rechaza la clase si la recibe como logo.
  const hasLogo = !!org?.brand?.logo_url?.startsWith("data:");
  // Google cachea imágenes por URL: el ?v= cambia con el contenido del logo
  // para que subir uno nuevo refresque la clase sin tocar código.
  const logoHash = (s: string) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  };
  return {
    serialNumber: card.id,
    orgId: card.organization_id,
    customerId: card.customer_id,
    programId: acc?.program_id ?? null,
    orgName: org?.name ?? "Comercio",
    logoUrl: hasLogo
      ? `${publicLogoUrl(baseUrl, card.organization_id)}?v=${logoHash(org!.brand!.logo_url!)}`
      : null,
    brandColor:
      typeof org?.brand?.color === "string" && /^#[0-9a-fA-F]{6}$/.test(org.brand.color)
        ? org.brand.color
        : null,
    lastMessage: await lastMessageBySerial(card.id),
    firstName: cust?.first_name ?? "Cliente",
    locations: await walletLocationsOf(card.organization_id, org?.name ?? "Comercio", org?.features ?? null),
    programName: prog?.name ?? "Fidelización",
    stamps:
      prog?.program_type === "stamps"
        ? { current: acc?.current_stamps ?? 0, goal: prog.stamp_goal ?? null }
        : null,
    points: prog?.program_type === "points" ? (acc?.current_points ?? 0) : null,
    cardUrl: `${baseUrl}/t/${card.token}`,
    revoked: card.status !== "active",
  };
}

export async function passDataByToken(token: string): Promise<WalletPassData | null> {
  const { data } = await supabaseAdmin()
    .from("customer_cards")
    .select(SELECT)
    .eq("token", token)
    .maybeSingle();
  return data ? await toPassData(data as unknown as CardRow) : null;
}

export async function passDataBySerial(serialNumber: string): Promise<WalletPassData | null> {
  const { data } = await supabaseAdmin()
    .from("customer_cards")
    .select(SELECT)
    .eq("id", serialNumber)
    .maybeSingle();
  return data ? await toPassData(data as unknown as CardRow) : null;
}
