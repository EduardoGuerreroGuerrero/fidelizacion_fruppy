// Logo del comercio: PNG con transparencia, guardado como data URI en
// organizations.brand.logo_url (sin bucket de Storage). Compartido por la
// creación de organización y la configuración (Settings) para que ambas
// rutas de carga validen y codifiquen el archivo exactamente igual.
const MAX_LOGO_BYTES = 256 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

export async function logoToDataUri(file: File): Promise<string | null> {
  if (file.size === 0) return null;
  if (file.type !== "image/png" || file.size > MAX_LOGO_BYTES) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  if (!PNG_MAGIC.every((b, i) => buf[i] === b)) return null;
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** URL pública servible por terceros (Google/Apple Wallet) para el logo de
 * una organización — nunca un data: URI, que esos proveedores no aceptan. */
export function publicLogoUrl(baseUrl: string, orgId: string): string {
  return `${baseUrl}/logo/${orgId}`;
}
