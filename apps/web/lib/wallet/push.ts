import { supabaseAdmin } from "@/lib/supabase/server";
import { walletProvider } from "./passlet";
import type { WalletPassData } from "./provider";

// Fontanería interna Wallet (no es server action): espejo de entregas en
// wallet_passes y pushes best-effort tras movimientos de fidelización.
// Nada de esto toca el ledger — un fallo de Wallet nunca afecta al saldo.

// Registro espejo de una entrega (rutas públicas /wallet/* o sync manual).
// El estado 'pending' significa "enlace de alta generado"; 'active' se
// reserva para una señal verificable de incorporación (webhook/sync del
// proveedor) — no afirmamos que la tarjeta se añadió al pulsar el botón.
// Best-effort: un fallo aquí nunca bloquea al cliente.
export async function recordWalletDelivery(
  data: WalletPassData,
  provider: "apple" | "google",
): Promise<void> {
  if (!data.programId) return;
  try {
    const admin = supabaseAdmin();
    // Si ya existe una fila (ej. 'active' por una señal previa) no se
    // degrada: regenerar el enlace no es evidencia nueva.
    const { data: existing } = await admin
      .from("wallet_passes")
      .select("id")
      .eq("organization_id", data.orgId)
      .eq("provider", provider)
      .eq("serial_number", data.serialNumber)
      .maybeSingle();
    if (existing) {
      await admin
        .from("wallet_passes")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", existing.id);
      return;
    }
    await admin.from("wallet_passes").insert({
      organization_id: data.orgId,
      customer_id: data.customerId,
      program_id: data.programId,
      provider,
      serial_number: data.serialNumber,
      status: "pending",
    });
  } catch (e) {
    console.error("[wallet] delivery record failed:", e instanceof Error ? e.message : e);
  }
}

// Push del estado actual hacia las wallets tras un movimiento de fidelización
// (scan/canje/revoke/rotate). Best-effort y acotado a pases con entrega
// registrada ('active' o 'pending' — el enlace se generó; si el cliente no
// llegó a añadirla, actualizar el objeto es un no-op inofensivo). Sin fila
// en wallet_passes no se empuja nada.
export async function pushWalletUpdate(serialNumber: string): Promise<void> {
  if (!walletProvider.configured()) return;
  try {
    const admin = supabaseAdmin();
    const { data: passes } = await admin
      .from("wallet_passes")
      .select("id")
      .eq("serial_number", serialNumber)
      .in("status", ["active", "pending"])
      .limit(1);
    if (!passes?.length) return;
    await walletProvider.updatePass(serialNumber);
  } catch (e) {
    console.error("[wallet] push update failed:", e instanceof Error ? e.message : e);
  }
}

// Mensaje promocional al titular del pase (Google: TEXT_AND_NOTIFY — push
// visible, máx. 3/pase/24h). Mismas reglas que pushWalletUpdate: solo pases
// con entrega registrada, best-effort, nunca bloquea.
export async function pushWalletMessage(
  serialNumber: string,
  header: string,
  body: string,
): Promise<void> {
  if (!walletProvider.configured()) return;
  try {
    const admin = supabaseAdmin();
    const { data: passes } = await admin
      .from("wallet_passes")
      .select("id")
      .eq("serial_number", serialNumber)
      .in("status", ["active", "pending"])
      .limit(1);
    if (!passes?.length) return;
    await walletProvider.sendPassMessage(serialNumber, { header, body });
  } catch (e) {
    console.error("[wallet] push message failed:", e instanceof Error ? e.message : e);
  }
}
