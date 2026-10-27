// Sedes → ubicaciones del pase. Google Wallet decide por su cuenta cuándo
// mostrar el aviso de proximidad (permisos del usuario, ajustes del
// dispositivo): aquí solo se publica DÓNDE están las sedes, nunca se conoce
// la posición del titular. Google admite un máximo de 10 por clase y solo
// coordenadas; el texto (relevantText) únicamente lo usa Apple.

export const MAX_WALLET_LOCATIONS = 10;

export type LocationRow = {
  name: string;
  lat: number | string | null;
  lng: number | string | null;
  status?: string;
};

export type WalletLocation = {
  latitude: number;
  longitude: number;
  relevantText: string;
};

export function validCoords(lat: unknown, lng: unknown): lat is number | string {
  if (lat === null || lat === undefined || lat === "" || lng === null || lng === undefined || lng === "")
    return false;
  const la = Number(lat);
  const lo = Number(lng);
  return Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180;
}

// Solo sedes activas con coordenadas válidas; sin duplicados (mismo punto a
// ~1 m) y con tope de 10. Devuelve también cuántas quedaron fuera por límite.
export function toWalletLocations(
  rows: LocationRow[],
  orgName: string,
): { locations: WalletLocation[]; overLimit: number } {
  const seen = new Set<string>();
  const out: WalletLocation[] = [];
  let overLimit = 0;
  for (const r of rows) {
    if (r.status && r.status !== "active") continue;
    if (!validCoords(r.lat, r.lng)) continue;
    const latitude = Number(r.lat);
    const longitude = Number(r.lng);
    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (out.length >= MAX_WALLET_LOCATIONS) {
      overLimit += 1;
      continue;
    }
    out.push({
      latitude,
      longitude,
      relevantText: `${orgName} · ${r.name}`.slice(0, 100),
    });
  }
  return { locations: out, overLimit };
}
