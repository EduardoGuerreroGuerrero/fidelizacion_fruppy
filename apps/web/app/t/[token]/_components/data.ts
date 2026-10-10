import { createClient } from "@/lib/supabase/server";

export type CardReward = {
  id: string;
  name: string;
  description: string | null;
  cost_stamps: number | null;
  cost_points: number | null;
  terms: string | null;
};

export type CardLocation = { id: string; name: string; address: string | null };

export type CardVisit = {
  visited_at: string;
  location: string | null;
  stamps: number;
};

export type CardRedemption = {
  id: string;
  reward: string;
  redeemed_at: string;
  location: string | null;
};

export type CardAppData = {
  org_name: string;
  first_name: string;
  program_name: string;
  program_type: "stamps" | "points";
  stamp_goal: number | null;
  reward_description: string | null;
  current_stamps: number;
  current_points: number;
  card_status: string;
  rewards: CardReward[];
  locations: CardLocation[];
  visits: CardVisit[];
  redemptions: CardRedemption[];
};

// Una sola RPC por render — la página del cliente es pública (el token ES
// la credencial) y la proyección no contiene PII sensible.
export async function getCardAppData(token: string): Promise<CardAppData | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_card_app_data", { p_token: token });
  return data as CardAppData | null;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
