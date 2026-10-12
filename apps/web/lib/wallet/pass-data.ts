import { supabaseAdmin } from "@/lib/supabase/server";
import type { WalletPassData } from "./provider";

// Carga del pase desde la DB (fuente de verdad) para emisión y updates.
// Usa service_role: el token de la tarjeta ES la credencial pública, y los
// updates por serial llegan desde callbacks internos de passlet.

const SELECT =
  "id, token, status, organization_id, customer_id, customers(first_name), " +
  "loyalty_accounts(program_id, current_stamps, current_points, loyalty_programs(name, program_type, stamp_goal)), " +
  "organizations(name)";

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
  organizations: { name: string } | { name: string }[] | null;
};

const first = <T>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

function toPassData(card: CardRow): WalletPassData {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cust = first(card.customers);
  const acc = first(card.loyalty_accounts);
  const prog = acc ? first(acc.loyalty_programs) : null;
  const org = first(card.organizations);
  return {
    serialNumber: card.id,
    orgId: card.organization_id,
    customerId: card.customer_id,
    programId: acc?.program_id ?? null,
    orgName: org?.name ?? "Comercio",
    firstName: cust?.first_name ?? "Cliente",
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
  return data ? toPassData(data as unknown as CardRow) : null;
}

export async function passDataBySerial(serialNumber: string): Promise<WalletPassData | null> {
  const { data } = await supabaseAdmin()
    .from("customer_cards")
    .select(SELECT)
    .eq("id", serialNumber)
    .maybeSingle();
  return data ? toPassData(data as unknown as CardRow) : null;
}
