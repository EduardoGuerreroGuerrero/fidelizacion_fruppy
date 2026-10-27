// URLs de las imágenes generadas para el pase de Google Wallet. Google las
// descarga y las cachea POR URL: el parámetro ?v= cambia con el contenido
// (saldo, color, nombre) para que cada actualización del pase refresque la
// imagen. Son rutas públicas sin PII sensible: banner del comercio y la
// tarjeta con nombre de pila + saldo, identificadas por ids opacos (uuid).

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function walletHeroUrl(
  baseUrl: string,
  orgId: string,
  brandColor: string | null,
  orgName: string,
  programName: string,
): string {
  const v = hash(`${brandColor ?? ""}|${orgName}|${programName}|1`);
  return `${baseUrl}/wallet-img/hero/${orgId}?v=${v}`;
}

// variant "hero": frente de la tarjeta (3:1, saldo enorme); "full": detalle
// del pase (más alto, con barra de progreso o sellos grandes).
export function walletCardImageUrl(
  baseUrl: string,
  serial: string,
  variant: "hero" | "full",
  parts: {
    firstName: string;
    current: number;
    goal: number | null;
    kind: "stamps" | "points";
    revoked: boolean;
    brandColor: string | null;
    next: { name: string; cost: number; ready: boolean } | null;
  },
): string {
  const v = hash(
    [
      variant,
      parts.firstName,
      parts.current,
      parts.goal,
      parts.kind,
      parts.revoked,
      parts.brandColor,
      parts.next ? `${parts.next.name}:${parts.next.cost}:${parts.next.ready}` : "",
      3,
    ].join("|"),
  );
  return `${baseUrl}/wallet-img/card/${serial}?k=${variant}&v=${v}`;
}

// URL canónica de la imagen de saldo de un pase: la usa el pase al publicarse
// y la ruta para comprobar que ?v= es el esperado (si no, redirige a esta).
export function cardImageUrlFor(
  baseUrl: string,
  data: {
    serialNumber: string;
    firstName: string;
    stamps: { current: number; goal: number | null } | null;
    points: number | null;
    revoked: boolean;
    brandColor: string | null;
    nextReward: { name: string; cost: number; ready: boolean } | null;
  },
  variant: "hero" | "full",
): string {
  return walletCardImageUrl(baseUrl, data.serialNumber, variant, {
    firstName: data.firstName,
    current: data.stamps ? data.stamps.current : (data.points ?? 0),
    goal: data.stamps?.goal ?? null,
    kind: data.stamps ? "stamps" : "points",
    revoked: data.revoked,
    brandColor: safeBrand(data.brandColor),
    next: data.nextReward,
  });
}

export const DEFAULT_BRAND = "#0f5132";

export function safeBrand(color: string | null | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_BRAND;
}
