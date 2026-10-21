// Los nombres propios se muestran y guardan capitalizados (primera letra
// de cada palabra en mayúscula) aunque se hayan registrado en minúscula.
export function displayName(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toLocaleUpperCase("es") + w.slice(1) : w))
    .join(" ");
}

// Iniciales para avatares/insignias ("Heladería La Esquina" → "HL").
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
