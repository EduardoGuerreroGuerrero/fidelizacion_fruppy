import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { passDataBySerial } from "@/lib/wallet/pass-data";
import { safeBrand } from "@/lib/wallet/images";

// Imágenes de saldo del pase de Google Wallet, con la estética de la tarjeta
// de la app (color del comercio, ondas, panel translúcido, insignia):
//  - k=hero (1032×336, 3:1): frente de la tarjeta → saldo enorme + anillo de
//    progreso al próximo premio (puntos) o fila de sellos.
//  - k=full (1032×560): detalle del pase → saldo enorme + barra de progreso
//    con "te faltan N para tu premio", o sellos grandes.
// La URL lleva ?v= del contenido: cada visita genera una imagen nueva.

const WHITE = "white";
const SOFT = "rgba(255,255,255,0.22)";

function Ring({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 84;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", position: "relative", width: 220, height: 220, alignItems: "center", justifyContent: "center" }}>
      <svg width="220" height="220" viewBox="0 0 200 200" style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx="100" cy="100" r={r} stroke={SOFT} strokeWidth="20" fill="none" />
        <circle
          cx="100"
          cy="100"
          r={r}
          stroke={WHITE}
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.001, pct) * c} ${c}`}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: WHITE }}>
        <div style={{ display: "flex", fontSize: 58, lineHeight: 1 }}>{label}</div>
        <div style={{ display: "flex", fontSize: 22, opacity: 0.85, marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}

function Dots({ total, filled, size, gap }: { total: number; filled: number; size: number; gap: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap, maxWidth: 4 * (size + gap) }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: size,
            height: size,
            borderRadius: size,
            background: i < filled ? WHITE : SOFT,
          }}
        />
      ))}
    </div>
  );
}

function Badge({ text, color, small }: { text: string; color: string; small?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        fontSize: small ? 22 : 26,
        padding: small ? "4px 18px" : "6px 22px",
        borderRadius: 40,
        background: "rgba(255,255,255,0.92)",
        color,
      }}
    >
      {text}
    </div>
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ serial: string }> }) {
  const { serial } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(serial)) return new Response("not found", { status: 404 });
  const variant = new URL(req.url).searchParams.get("k") === "hero" ? "hero" : "full";

  const d = await passDataBySerial(serial);
  if (!d) return new Response("not found", { status: 404 });

  const color = safeBrand(d.brandColor);
  const isStamps = !!d.stamps;
  const current = isStamps ? d.stamps!.current : (d.points ?? 0);
  const goal = isStamps ? (d.stamps!.goal ?? null) : null;
  const unit = isStamps ? "sellos" : "puntos";
  const total = isStamps && goal && goal <= 12 ? goal : 0;
  const next = d.nextReward;
  const pct = next ? Math.min(1, current / next.cost) : 0;
  const remaining = next ? Math.max(0, next.cost - current) : 0;
  const status = d.revoked ? "Tarjeta revocada" : "Cliente activo";

  const bigNumber = (size: number): ReactElement => (
    <div style={{ display: "flex", alignItems: "flex-end", color: WHITE }}>
      <div style={{ display: "flex", fontSize: size, lineHeight: 0.95 }}>{current}</div>
      {goal ? (
        <div style={{ display: "flex", fontSize: size * 0.5, opacity: 0.75, marginBottom: size * 0.04, marginLeft: 8 }}>
          {`/${goal}`}
        </div>
      ) : null}
      <div style={{ display: "flex", fontSize: size * 0.2, opacity: 0.9, marginBottom: size * 0.1, marginLeft: 16 }}>
        {unit}
      </div>
    </div>
  );

  const deco = (
    <>
      <div
        style={{
          position: "absolute",
          left: -120,
          top: -200,
          width: 520,
          height: 520,
          borderRadius: 520,
          background: "rgba(255,255,255,0.08)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -100,
          bottom: -170,
          width: 400,
          height: 400,
          borderRadius: 400,
          background: "rgba(255,255,255,0.06)",
          display: "flex",
        }}
      />
    </>
  );

  if (variant === "hero") {
    const right = total > 0
      ? <Dots total={total} filled={current} size={46} gap={14} />
      : next
        ? <Ring pct={pct} label={next.ready ? "¡Listo!" : String(remaining)} sub={next.ready ? "premio" : "al premio"} />
        : null;
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            background: color,
            padding: "0 64px",
            position: "relative",
          }}
        >
          {deco}
          <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", fontSize: 34, color: WHITE, marginBottom: 10 }}>{d.firstName}</div>
              <Badge text={status} color={color} small />
              <div style={{ display: "flex", marginTop: 14 }}>{bigNumber(170)}</div>
            </div>
            <div style={{ display: "flex" }}>{right}</div>
          </div>
        </div>
      ),
      { width: 1032, height: 336, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: color,
          padding: "48px 64px",
          position: "relative",
        }}
      >
        {deco}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 44, color: WHITE }}>{d.firstName}</div>
          <Badge text={status} color={color} />
        </div>
        <div style={{ display: "flex" }}>{bigNumber(250)}</div>
        {total > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 16 }}>
              {Array.from({ length: total }, (_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flex: 1,
                    height: 56,
                    borderRadius: 28,
                    background: i < current ? WHITE : SOFT,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: WHITE, opacity: 0.9, marginTop: 14 }}>
              {current >= total ? "¡Tarjeta completa!" : `Te faltan ${total - current} sellos`}
            </div>
          </div>
        ) : next ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", height: 40, borderRadius: 20, background: SOFT }}>
              <div style={{ display: "flex", width: `${Math.max(4, pct * 100)}%`, height: 40, borderRadius: 20, background: WHITE }} />
            </div>
            <div style={{ display: "flex", fontSize: 30, color: WHITE, opacity: 0.9, marginTop: 14, maxWidth: 900 }}>
              {next.ready
                ? `¡Premio disponible: ${next.name}!`
                : `Te faltan ${remaining} puntos para ${next.name}`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
      </div>
    ),
    { width: 1032, height: 560, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
