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

// Cuota de Google: máx. 3 mensajes TEXT_AND_NOTIFY por pase cada 24h. Se
// rastrea en wallet_passes (notify_count/notify_window_start) para no gastar
// llamadas: agotada la ventana se envía como TEXT — queda dentro del pase,
// sin alerta en el teléfono — y se reporta como 'limited'.
const NOTIFY_QUOTA = 3;
const NOTIFY_WINDOW_MS = 24 * 60 * 60 * 1000;

function isQuotaError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { status?: number; code?: string };
  return err.status === 429 || err.code === "GOOGLE_RATE_LIMITED";
}

export type WalletCampaignResult = {
  /** TEXT_AND_NOTIFY entregados (push visible). */
  notified: number;
  /** TEXT degradados por cuota (visibles solo dentro del pase). */
  textOnly: number;
  /** Pases que no recibieron aviso por el límite de Google. */
  limited: number;
  /** Fallos de API/distintos de cuota. */
  failed: number;
};

// Mensaje de campaña hacia los pases Google entregados de un comercio.
// Best-effort por pase: un fallo no detiene el resto.
export async function pushCampaignToWallets(
  orgId: string,
  title: string,
  body: string,
): Promise<WalletCampaignResult> {
  const out: WalletCampaignResult = { notified: 0, textOnly: 0, limited: 0, failed: 0 };
  if (!walletProvider.configured()) return out;

  const admin = supabaseAdmin();
  const { data: passes } = await admin
    .from("wallet_passes")
    .select("id, serial_number, notify_count, notify_window_start")
    .eq("organization_id", orgId)
    .eq("provider", "google")
    .in("status", ["active", "pending"]);

  for (const p of passes ?? []) {
    const windowStart = p.notify_window_start
      ? new Date(p.notify_window_start).getTime()
      : 0;
    const inWindow = Date.now() - windowStart < NOTIFY_WINDOW_MS;
    const used = inWindow ? (p.notify_count ?? 0) : 0;

    if (used >= NOTIFY_QUOTA) {
      // Cuota agotada según nuestro registro: degradar sin llamar a notify.
      out.limited += 1;
      try {
        await walletProvider.sendPassMessage(p.serial_number, {
          header: title,
          body,
          notify: false,
        });
        out.textOnly += 1;
      } catch {
        out.failed += 1;
      }
      continue;
    }

    try {
      await walletProvider.sendPassMessage(p.serial_number, {
        header: title,
        body,
        notify: true,
      });
      await admin
        .from("wallet_passes")
        .update({
          notify_count: used + 1,
          notify_window_start: inWindow
            ? p.notify_window_start
            : new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          last_sync_error_code: null,
        })
        .eq("id", p.id);
      out.notified += 1;
    } catch (e) {
      if (isQuotaError(e)) {
        // Google rechazó por cuota (nuestro contador estaba desfasado):
        // marcar como agotada y degradar a TEXT.
        out.limited += 1;
        try {
          await walletProvider.sendPassMessage(p.serial_number, {
            header: title,
            body,
            notify: false,
          });
          out.textOnly += 1;
        } catch {
          out.failed += 1;
        }
        await admin
          .from("wallet_passes")
          .update({
            notify_count: NOTIFY_QUOTA,
            notify_window_start: p.notify_window_start ?? new Date().toISOString(),
            last_sync_error_code: "google_quota",
          })
          .eq("id", p.id);
      } else {
        out.failed += 1;
        await admin
          .from("wallet_passes")
          .update({
            last_sync_error_code:
              e instanceof Error ? e.message.slice(0, 120) : "send_failed",
          })
          .eq("id", p.id);
      }
    }
  }
  return out;
}
