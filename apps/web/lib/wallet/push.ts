import { supabaseAdmin } from "@/lib/supabase/server";
import { walletProvider } from "./passlet";
import type { WalletPassData } from "./provider";

// Fontanería interna Wallet (no es server action): espejo de entregas en
// wallet_passes y pushes best-effort tras movimientos de fidelización.
// Nada de esto toca el ledger — un fallo de Wallet nunca afecta al saldo.

// Registro espejo de una entrega (rutas públicas /wallet/* o sync manual).
// Best-effort: un fallo aquí nunca bloquea al cliente — sin la fila, los
// pushes de update simplemente no se envían para ese serial.
export async function recordWalletDelivery(
  data: WalletPassData,
  provider: "apple" | "google",
): Promise<void> {
  if (!data.programId) return;
  try {
    await supabaseAdmin()
      .from("wallet_passes")
      .upsert(
        {
          organization_id: data.orgId,
          customer_id: data.customerId,
          program_id: data.programId,
          provider,
          serial_number: data.serialNumber,
          status: "active",
          last_synced_at: new Date().toISOString(),
          last_sync_error_code: null,
        },
        { onConflict: "organization_id,provider,serial_number" },
      );
  } catch (e) {
    console.error("[wallet] delivery record failed:", e instanceof Error ? e.message : e);
  }
}

// Push del estado actual hacia las wallets tras un movimiento de fidelización
// (scan/canje/revoke/rotate). Best-effort y acotado a pases efectivamente
// entregados: sin fila 'active' en wallet_passes no se empuja nada — así un
// escaneo de un cliente que nunca añadió la tarjeta no crea objetos fantasma
// en Google ni añade latencia.
export async function pushWalletUpdate(serialNumber: string): Promise<void> {
  if (!walletProvider.configured()) return;
  try {
    const admin = supabaseAdmin();
    const { data: passes } = await admin
      .from("wallet_passes")
      .select("id")
      .eq("serial_number", serialNumber)
      .eq("status", "active")
      .limit(1);
    if (!passes?.length) return;
    await walletProvider.updatePass(serialNumber);
  } catch (e) {
    console.error("[wallet] push update failed:", e instanceof Error ? e.message : e);
  }
}
