import { APPLE_PASS_CONTENT_TYPE } from "passlet";
import { walletProvider } from "@/lib/wallet/passlet";
import { passDataByToken } from "@/lib/wallet/pass-data";

// "Añadir a Apple Wallet": genera el .pkpass firmado al momento y lo sirve
// como descarga. iOS lo abre directo en Wallet si el content type es correcto.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{32}$/i.test(token) || !walletProvider.appleEnabled()) {
    return new Response("not found", { status: 404 });
  }

  const data = await passDataByToken(token);
  if (!data || data.revoked) return new Response("not found", { status: 404 });

  const { applePkpass } = await walletProvider.issuePass(data);
  if (!applePkpass) return new Response("not found", { status: 404 });

  return new Response(new Uint8Array(applePkpass), {
    headers: {
      "Content-Type": APPLE_PASS_CONTENT_TYPE,
      "Content-Disposition": 'attachment; filename="fruppy-card.pkpass"',
      "Cache-Control": "no-store",
    },
  });
}
