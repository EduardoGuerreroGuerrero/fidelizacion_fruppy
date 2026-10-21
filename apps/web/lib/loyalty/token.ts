// Normaliza lo que el cajero pega, teclea o escanea en "Registrar visita":
//  - el token tal cual (32 hex),
//  - el código agrupado que muestra la tarjeta ("4ec3 c05f …" o con guiones),
//  - la URL completa de la tarjeta (https://…/t/<token>[/…]).
// Devuelve el token en minúsculas; si no calza con ninguna forma, el texto
// compactado (la RPC responde "tarjeta no encontrada").
export function normalizeCardToken(raw: string): string {
  const s = raw.trim();
  const fromUrl = s.match(/\/t\/([a-f0-9]{32})(?![a-f0-9])/i);
  if (fromUrl) return fromUrl[1].toLowerCase();
  return s.replace(/[\s-]+/g, "").toLowerCase();
}
