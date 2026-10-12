// Organización con UI de marca propia (mockups "Panel admin-owner").
// Solo Fruppy Helados usa este shell; el resto de orgs conserva la UI genérica.
export const FRUPPY_SLUG = "fruppy-helados";

// Paleta de avatares con iniciales (cicla por índice de cliente).
export const AVATAR_STYLES = [
  "bg-pastel-lav text-[#7c5cd6]",
  "bg-pastel-pink text-accent",
  "bg-pastel-mint text-brand-dark",
  "bg-pastel-sky text-[#3f8fd2]",
  "bg-pastel-cream text-[#d98a2b]",
] as const;

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// "Hace 5 min" / "Hace 2 horas" / "Hace 3 días".
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hace 1 día";
  if (days < 30) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-CO");
}

export function pctDelta(current: number, previous: number): string {
  if (previous <= 0) return current > 0 ? "+100%" : "0%";
  const d = Math.round(((current - previous) / previous) * 100);
  return `${d >= 0 ? "+" : ""}${d}%`;
}
