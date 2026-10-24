// Destino de una campaña push. Las rutas del cliente viven bajo /t/[token]
// (token = credencial de SU tarjeta), así que un enlace interno guardado como
// "/promociones" se resuelve por destinatario al enviar. https:// se respeta
// tal cual; sin enlace se abre la tarjeta del cliente.

export const CARD_DESTINATIONS = [
  { value: "card", label: "Mi tarjeta", url: null },
  { value: "promos", label: "Promociones", url: "/promociones" },
  { value: "bonos", label: "Bonos", url: "/bonos" },
  { value: "sedes", label: "Sedes", url: "/sedes" },
] as const;

export function resolveCampaignUrl(url: string | null, cardToken: string | null): string {
  if (url && /^https:\/\//.test(url)) return url;
  if (!cardToken) return "/";
  const base = `/t/${cardToken}`;
  if (!url || url === "/") return base;
  if (url.startsWith("/t/")) return url;
  return `${base}${url}`;
}

// datetime-local llega sin zona y el servidor corre en UTC: el navegador
// manda su getTimezoneOffset() (minutos, UTC − local) para fijar la hora real.
export function scheduleToDate(local: string, tzOffsetMin: number): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return new Date(NaN);
  const [, y, mo, d, h, mi] = m;
  const utc = Date.UTC(+y, +mo - 1, +d, +h, +mi) + (Number.isFinite(tzOffsetMin) ? tzOffsetMin : 0) * 60_000;
  return new Date(utc);
}
