import sharp from "sharp";

// Logo del comercio: se acepta cualquier formato que sharp decodifique
// (PNG, JPEG, WebP, AVIF, GIF, SVG…). Se normaliza a PNG ≤512 px y, si el
// fondo es de un solo color (o casi: blanco con viñeta/gradiente suave,
// típico en logos entregados como JPG), se vuelve transparente con flood
// fill desde los bordes — así el blanco DENTRO del logo no se borra. El
// resultado se guarda como data URI en organizations.brand.logo_url (sin
// bucket de Storage). Compartido por la creación de organización y la
// configuración (Settings) para que ambas rutas validen igual.
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_LOGO_BYTES = 256 * 1024;
const MAX_DIM = 512;
const MAX_INPUT_PIXELS = 40_000_000;

// Distancia RGB fuera del rango de fondo: ≤BG_HARD → transparente; entre
// BG_HARD y BG_SOFT → alfa parcial (banda de transición sin dientes de sierra).
const BG_HARD = 20;
const BG_SOFT = 70;
// El fondo se modela como rango por canal [lo,hi] de los píxeles del marco
// del borde (percentiles 3–97). Un marco con >120 de span por canal o donde
// <80% cae dentro del rango es una foto/degradado fuerte, no un fondo sólido.
const BG_MAX_SPAN = 120;
const BG_BORDER_DOMINANCE = 0.8;
// Si el flood fill alcanza casi toda la imagen, no había logo distinguible:
// mejor conservar el original que guardar un PNG vacío.
const MAX_BG_FRACTION = 0.92;

type Range = { lo: number[]; hi: number[] };

// Distancia² fuera del rango [lo,hi] por canal (0 si el píxel está dentro).
function outside2(px: Buffer, i4: number, r: Range): number {
  let s = 0;
  for (let c = 0; c < 3; c++) {
    const v = px[i4 + c];
    const d = v < r.lo[c] ? r.lo[c] - v : v > r.hi[c] ? v - r.hi[c] : 0;
    s += d * d;
  }
  return s;
}

// Índices del anillo de borde (RING px de grosor) con alfa opaco, y la
// fracción ya transparente — para no tocar PNG/SVG que ya traen alfa.
function borderRing(w: number, h: number) {
  const ring = Math.max(1, Math.min(4, Math.round(Math.min(w, h) / 80)));
  const idx: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < ring || x >= w - ring || y < ring || y >= h - ring) idx.push(y * w + x);
  return idx;
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100))];
}

// Quita el fondo de un solo color por BFS desde el borde (solo píxeles
// conectados al exterior: el fondo no "salta" a regiones internas del logo
// que coincidan en color). Devuelve false si no hay fondo dominante que quitar.
function removeSolidBackground(px: Buffer, w: number, h: number): boolean {
  const border = borderRing(w, h);
  let transparent = 0;
  const chans: number[][] = [[], [], []];
  for (const i of border) {
    const i4 = i * 4;
    if (px[i4 + 3] < 128) {
      transparent++;
      continue;
    }
    for (let c = 0; c < 3; c++) chans[c].push(px[i4 + c]);
  }
  // >15% del borde ya transparente → la imagen ya venía recortada.
  if (transparent / border.length > 0.15 || chans[0].length === 0) return false;

  for (const ch of chans) ch.sort((a, b) => a - b);
  const range: Range = {
    lo: chans.map((ch) => percentile(ch, 3)),
    hi: chans.map((ch) => percentile(ch, 97)),
  };
  // Fondo demasiado variado (foto, degradado fuerte) → no inventar alfa.
  for (let c = 0; c < 3; c++) if (range.hi[c] - range.lo[c] > BG_MAX_SPAN) return false;

  // El rango debe cubrir la gran mayoría del borde (si el logo toca mucho el
  // margen, el "fondo" no es dominante y el resultado sería errático).
  let inside = 0;
  const soft2 = BG_SOFT * BG_SOFT;
  for (const i of border)
    if (px[i * 4 + 3] >= 128 && outside2(px, i * 4, range) === 0) inside++;
  if (inside / chans[0].length < BG_BORDER_DOMINANCE) return false;

  const n = w * h;
  const visited = new Uint8Array(n);
  const queue = new Int32Array(n);
  let qh = 0,
    qt = 0;
  const seed = (i: number) => {
    if (!visited[i] && px[i * 4 + 3] > 0 && outside2(px, i * 4, range) < soft2) {
      visited[i] = 1;
      queue[qt++] = i;
    }
  };
  for (const i of border) seed(i);
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (y > 0) seed(i - w);
    if (y < h - 1) seed(i + w);
  }
  if (qt === 0 || qt / n > MAX_BG_FRACTION) return false;

  const span = BG_SOFT - BG_HARD;
  for (let qi = 0; qi < qt; qi++) {
    const i4 = queue[qi] * 4;
    const d2 = outside2(px, i4, range);
    if (d2 === 0 || d2 <= BG_HARD * BG_HARD) {
      px[i4 + 3] = 0;
      continue;
    }
    // Borde suave: alfa proporcional a la distancia y "decontaminación" del
    // color (c ≈ a·fg + (1-a)·bg ⇒ fg = (c − (1-a)·bg)/a) para no dejar halo
    // del color de fondo alrededor del logo.
    const alpha = Math.round((255 * (Math.sqrt(d2) - BG_HARD)) / span);
    const f = alpha / 255;
    for (let c = 0; c < 3; c++) {
      const bg = Math.min(Math.max(px[i4 + c], range.lo[c]), range.hi[c]);
      const fg = Math.round((px[i4 + c] - (1 - f) * bg) / f);
      px[i4 + c] = Math.max(0, Math.min(255, fg));
    }
    px[i4 + 3] = alpha;
  }
  return true;
}

// Recuadro de contenido visible (alfa > 8) — además de quitar el fondo,
// recorta márgenes transparentes que traiga el archivo.
function contentBox(px: Buffer, w: number, h: number) {
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  return maxX < 0
    ? null
    : { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export async function logoToDataUri(file: File): Promise<string | null> {
  if (file.size === 0 || file.size > MAX_INPUT_BYTES) return null;
  try {
    const src = Buffer.from(await file.arrayBuffer());
    const { data: px, info } = await sharp(src, {
      density: 300,
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width: w, height: h } = info;
    removeSolidBackground(px, w, h);
    const box = contentBox(px, w, h);
    if (!box) return null;

    const base = () =>
      sharp(px, { raw: { width: w, height: h, channels: 4 } }).extract(box);
    let png = await base().png({ compressionLevel: 9 }).toBuffer();
    if (png.length > MAX_LOGO_BYTES)
      png = await base()
        .png({ compressionLevel: 9, palette: true, quality: 80 })
        .toBuffer();
    if (png.length > MAX_LOGO_BYTES) return null;
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/** URL pública servible por terceros (Google/Apple Wallet) para el logo de
 * una organización — nunca un data: URI, que esos proveedores no aceptan. */
export function publicLogoUrl(baseUrl: string, orgId: string): string {
  return `${baseUrl}/logo/${orgId}`;
}
