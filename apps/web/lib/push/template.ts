// Variables de mensaje de campaña. Nunca sale un marcador sin resolver:
// una variable conocida sin valor usa un texto alternativo seguro y una
// desconocida se elimina.

export const CAMPAIGN_VARIABLES = ["negocio", "nombre"] as const;

export type CampaignVars = { negocio?: string | null; nombre?: string | null };

const FALLBACK: Record<(typeof CAMPAIGN_VARIABLES)[number], string> = {
  negocio: "tu comercio",
  nombre: "",
};

export function renderCampaignText(text: string, vars: CampaignVars): string {
  const out = text.replace(/\{\s*([a-z_]+)\s*\}/gi, (_m, raw: string) => {
    const key = raw.toLowerCase() as (typeof CAMPAIGN_VARIABLES)[number];
    if (!(CAMPAIGN_VARIABLES as readonly string[]).includes(key)) return "";
    const v = vars[key];
    return v && v.trim() ? v.trim() : FALLBACK[key];
  });
  // Limpia los huecos que deja una variable vacía ("Hola , ..." → "Hola, ...").
  return out.replace(/\s+([,.;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
}
