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

export function walletCardImageUrl(
  baseUrl: string,
  serial: string,
  parts: {
    firstName: string;
    current: number;
    goal: number | null;
    kind: "stamps" | "points";
    revoked: boolean;
    brandColor: string | null;
  },
): string {
  const v = hash(
    [parts.firstName, parts.current, parts.goal, parts.kind, parts.revoked, parts.brandColor, 2].join("|"),
  );
  return `${baseUrl}/wallet-img/card/${serial}?v=${v}`;
}

export const DEFAULT_BRAND = "#0f5132";

export function safeBrand(color: string | null | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_BRAND;
}
