import QRCode from "qrcode";

// QR público de la tarjeta en PNG — lo usan el correo de entrega y el
// onboarding en mostrador. Solo codifica URLs internas /t/<token>, así que
// no sirve como generador abierto. El token en sí es el secreto.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return new Response("not found", { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const png = await QRCode.toBuffer(`${baseUrl}/t/${token}`, {
    width: 480,
    margin: 2,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
