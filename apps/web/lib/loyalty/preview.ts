"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";

export type CardPreview = {
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  marketing: boolean;
  programName: string;
  programType: string;
  currentStamps: number;
  stampGoal: number | null;
  currentPoints: number;
};

// Resuelve un token de tarjeta al cliente dueño para previsualizar en
// "Registrar visita" (mockup "Cliente detectado"). Solo lectura; la RLS de
// customer_cards limita al miembro a tarjetas de su propia organización.
export async function lookupCardCustomer(
  orgSlug: string,
  token: string,
): Promise<CardPreview | null> {
  const clean = token.trim();
  if (!clean || clean.length > 200) return null;

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;

  // Alcance por organización del slug (además de la RLS por membresía): un
  // miembro de varias orgs no puede previsualizar tarjetas de otra org aquí.
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return null;

  const { data: card } = await supabase
    .from("customer_cards")
    .select(
      `status, customers(first_name, last_name, email, phone, status, marketing_consent_at), loyalty_accounts(current_stamps, current_points, loyalty_programs(name, program_type, stamp_goal))`,
    )
    .eq("organization_id", org.id)
    .eq("token", clean)
    .maybeSingle();
  if (!card) return null;

  const c = Array.isArray(card.customers) ? card.customers[0] : card.customers;
  const acc = Array.isArray(card.loyalty_accounts)
    ? card.loyalty_accounts[0]
    : card.loyalty_accounts;
  const prog = acc
    ? Array.isArray(acc.loyalty_programs)
      ? acc.loyalty_programs[0]
      : acc.loyalty_programs
    : null;

  return {
    name: `${c?.first_name ?? ""} ${c?.last_name ?? ""}`.trim() || "Cliente",
    email: c?.email ?? null,
    phone: c?.phone ?? null,
    status: c?.status ?? card.status,
    marketing: Boolean(c?.marketing_consent_at),
    programName: prog?.name ?? "Programa",
    programType: prog?.program_type ?? "stamps",
    currentStamps: acc?.current_stamps ?? 0,
    stampGoal: prog?.stamp_goal ?? null,
    currentPoints: acc?.current_points ?? 0,
  };
}
