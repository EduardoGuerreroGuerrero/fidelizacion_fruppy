import { NextResponse } from "next/server";
import { walletProvider } from "@/lib/wallet/passlet";
import { passDataByToken } from "@/lib/wallet/pass-data";
import { recordWalletDelivery } from "@/lib/wallet/push";

// "Añadir a Google Wallet": genera el JWT del pase al momento y redirige a
// la URL de guardado de Google. El token de la tarjeta es la credencial.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const back = `${baseUrl}/t/${token}`;

  if (!/^[a-f0-9]{32}$/i.test(token) || !walletProvider.googleEnabled()) {
    return NextResponse.redirect(back);
  }

  const data = await passDataByToken(token);
  if (!data || data.revoked) return NextResponse.redirect(back);

  const { googleSaveUrl } = await walletProvider.issuePass(data);
  if (!googleSaveUrl) return NextResponse.redirect(back);
  await recordWalletDelivery(data, "google");
  return NextResponse.redirect(googleSaveUrl);
}
