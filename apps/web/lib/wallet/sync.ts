"use server";

import { redirect } from "next/navigation";
import { createClient, getAuthUser, supabaseAdmin } from "@/lib/supabase/server";
import { walletProvider } from "./passlet";
import { passDataByToken } from "./pass-data";
import { WalletNotConfiguredError } from "./provider";

// Sincronización Wallet: wallet_passes es ESPEJO técnico (serial, estado,
// último error). Nunca toca el ledger — un fallo de Wallet no revierte
// puntos ni sellos. Idempotente: upsert por (org, provider, serial).

type SyncResult = { ok: boolean; detail: string };

export async function syncWalletPass(orgSlug: string, customerId: string): Promise<SyncResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, brand")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { ok: false, detail: "forbidden" };

  const { data: card } = await supabase
    .from("customer_cards")
    .select("id, token, loyalty_accounts(program_id)")
    .eq("customer_id", customerId)
    .eq("organization_id", org.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!card) return { ok: false, detail: "no_active_card" };

  // Misma construcción que load()/emisión: pass-data es la única fuente —
  // incluye color de marca, logo validado y último mensaje del pase.
  const passData = await passDataByToken(card.token);
  if (!passData) return { ok: false, detail: "no_active_card" };
  const accRow = Array.isArray(card.loyalty_accounts)
    ? card.loyalty_accounts[0]
    : card.loyalty_accounts;

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return { ok: false, detail: "service_role_missing" };
  }

  const platforms: Array<"apple" | "google"> = [];
  if (process.env.APPLE_WALLET_ENABLED === "true") platforms.push("apple");
  if (process.env.GOOGLE_WALLET_ENABLED === "true") platforms.push("google");

  const record = async (provider: "apple" | "google", status: string, errorCode: string | null) =>
    admin.from("wallet_passes").upsert(
      {
        organization_id: org.id,
        customer_id: customerId,
        program_id: accRow?.program_id ?? null,
        provider,
        serial_number: card.id,
        status,
        last_sync_error_code: errorCode,
        last_synced_at: status === "active" ? new Date().toISOString() : null,
      },
      { onConflict: "organization_id,provider,serial_number" },
    );

  if (!walletProvider.configured() || platforms.length === 0) {
    for (const p of ["apple", "google"] as const) await record(p, "error", "wallet_not_configured");
    return { ok: false, detail: "wallet_not_configured" };
  }

  try {
    const result = await walletProvider.issuePass(passData);
    if (result.applePkpass) await record("apple", "active", null);
    if (result.googleSaveUrl) await record("google", "active", null);
    return { ok: true, detail: "synced" };
  } catch (e) {
    const code =
      e instanceof WalletNotConfiguredError
        ? "wallet_not_configured"
        : e instanceof Error
          ? e.message.slice(0, 120)
          : "wallet_error";
    for (const p of platforms) await record(p, "error", code);
    return { ok: false, detail: code };
  }
}

// Form action: redirige a la ficha con el resultado (F5-T5-style feedback).
export async function syncWalletFormAction(orgSlug: string, customerId: string): Promise<void> {
  const r = await syncWalletPass(orgSlug, customerId);
  const msgs: Record<string, string> = {
    synced: "Pase sincronizado con Wallet.",
    wallet_not_configured:
      "Wallet sin credenciales configuradas — la tarjeta web sigue funcionando.",
    service_role_missing: "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    no_active_card: "El cliente no tiene tarjeta activa.",
    forbidden: "Sin acceso.",
  };
  redirect(
    `/dashboard/${orgSlug}/customers/${customerId}?` +
      `${r.ok ? "ok" : "error"}=` +
      encodeURIComponent(msgs[r.detail] ?? r.detail),
  );
}
