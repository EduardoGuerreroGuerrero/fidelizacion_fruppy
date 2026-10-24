import { ImageResponse } from "next/og";
import { passDataBySerial } from "@/lib/wallet/pass-data";
import { safeBrand } from "@/lib/wallet/images";

// Imagen de saldo dentro del pase de Google Wallet: replica la tarjeta de la
// app (nombre, insignia, contador grande con su unidad y, en sellos, la fila
// de progreso). Se regenera con cada movimiento vía ?v= en la URL del pase.
export async function GET(_req: Request, ctx: { params: Promise<{ serial: string }> }) {
  const { serial } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(serial)) return new Response("not found", { status: 404 });

  const d = await passDataBySerial(serial);
  if (!d) return new Response("not found", { status: 404 });

  const color = safeBrand(d.brandColor);
  const isStamps = !!d.stamps;
  const current = isStamps ? d.stamps!.current : (d.points ?? 0);
  const goal = isStamps ? (d.stamps!.goal ?? null) : null;
  const unit = isStamps ? "sellos" : "puntos";
  const dots = isStamps && goal && goal <= 12 ? goal : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: color,
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 44,
            background: "rgba(255,255,255,0.12)",
            color: "white",
            padding: "36px 48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 46, display: "flex", maxWidth: 560 }}>{d.firstName}</div>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignSelf: "flex-start",
                  fontSize: 24,
                  padding: "6px 22px",
                  borderRadius: 40,
                  background: "rgba(255,255,255,0.92)",
                  color,
                }}
              >
                {d.revoked ? "Tarjeta revocada" : "Cliente activo"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 128, lineHeight: 1 }}>
                {current}
                {goal ? <span style={{ opacity: 0.75, fontSize: 84, alignSelf: "flex-end", marginBottom: 8 }}>{` / ${goal}`}</span> : null}
              </div>
              <div style={{ display: "flex", fontSize: 32, opacity: 0.85 }}>{unit}</div>
            </div>
          </div>
          {dots > 0 ? (
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              {Array.from({ length: dots }, (_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    width: 48,
                    height: 48,
                    borderRadius: 48,
                    background: i < current ? "white" : "rgba(255,255,255,0.22)",
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>
      </div>
    ),
    {
      width: 1032,
      height: dots > 0 ? 420 : 300,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
