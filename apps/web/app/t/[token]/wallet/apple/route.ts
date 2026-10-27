import { APPLE_PASS_CONTENT_TYPE } from "passlet";
import { walletProvider } from "@/lib/wallet/passlet";
import { passDataByToken } from "@/lib/wallet/pass-data";
import { recordWalletDelivery } from "@/lib/wallet/push";
import { limitRequest } from "@/lib/ratelimit";

// "Añadir a Apple Wallet": genera el .pkpass firmado al momento y lo sirve
// como descarga. iOS lo abre directo en Wallet si el content type es correcto.
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{32}$/i.test(token) || !walletProvider.appleEnabled()) {
    return new Response("not found", { status: 404 });
  }

  const limited = await limitRequest(req, "wallet-apple", token, 6, 3600);
  if (limited) return limited;

  const data = await passDataByToken(token);
  if (!data || data.revoked) return new Response("not found", { status: 404 });

  const { applePkpass } = await walletProvider.issuePass(data);
  if (!applePkpass) return new Response("not found", { status: 404 });
  await recordWalletDelivery(data, "apple");

  return new Response(new Uint8Array(applePkpass), {
    headers: {
      "Content-Type": APPLE_PASS_CONTENT_TYPE,
      "Content-Disposition": 'attachment; filename="tarjeta-fidelidad.pkpass"',
      "Cache-Control": "no-store",
    },
  });
}
