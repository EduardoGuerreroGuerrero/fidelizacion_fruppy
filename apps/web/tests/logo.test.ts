import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { logoToDataUri } from "../lib/organizations/logo";

const asFile = (buf: Buffer, type = "image/png") =>
  new File([new Uint8Array(buf)], "logo", { type });

async function decode(dataUri: string) {
  assert.match(dataUri, /^data:image\/png;base64,/);
  const png = Buffer.from(dataUri.slice("data:image/png;base64,".length), "base64");
  return sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

const px = (d: Buffer, w: number, x: number, y: number) => {
  const i = (y * w + x) * 4;
  return { r: d[i], g: d[i + 1], b: d[i + 2], a: d[i + 3] };
};

async function solid(w: number, h: number, color: string) {
  return sharp({ create: { width: w, height: h, channels: 3, background: color } })
    .png()
    .toBuffer();
}

test("JPEG con fondo blanco: el fondo queda transparente y recorta al logo", async () => {
  const jpeg = await sharp({
    create: { width: 120, height: 80, channels: 3, background: "#ffffff" },
  })
    .composite([{ input: await solid(40, 30, "#0f5132"), top: 25, left: 40 }])
    .jpeg()
    .toBuffer();

  const uri = await logoToDataUri(asFile(jpeg, "image/jpeg"));
  assert.ok(uri);
  const { data, info } = await decode(uri);
  // Recortado al contenido (40×30), todo opaco y verde.
  assert.ok(Math.abs(info.width - 40) <= 2 && Math.abs(info.height - 30) <= 2);
  const c = px(data, info.width, info.width >> 1, info.height >> 1);
  assert.equal(c.a, 255);
  assert.ok(c.g > c.r && c.g > c.b);
});

test("blanco dentro del logo no se borra: solo fondo conectado al borde", async () => {
  const png = await sharp({
    create: { width: 120, height: 120, channels: 3, background: "#ffffff" },
  })
    .composite([
      { input: await solid(60, 60, "#0f5132"), top: 30, left: 30 },
      { input: await solid(20, 20, "#ffffff"), top: 50, left: 50 },
    ])
    .png()
    .toBuffer();

  const uri = await logoToDataUri(asFile(png));
  assert.ok(uri);
  const { data, info } = await decode(uri);
  // El recuadro blanco interior quedó opaco…
  const center = px(data, info.width, info.width >> 1, info.height >> 1);
  assert.equal(center.a, 255);
  assert.ok(center.r > 230 && center.g > 230 && center.b > 230);
  // …y el fondo exterior sí se eliminó (el recorte cae al contenido).
  assert.ok(info.width <= 62 && info.height <= 62);
});

test("PNG ya transparente: se conserva el alfa y se recorta el margen", async () => {
  const png = await sharp({
    create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: await solid(50, 40, "#b3202c"), top: 20, left: 25 }])
    .png()
    .toBuffer();

  const uri = await logoToDataUri(asFile(png));
  assert.ok(uri);
  const { data, info } = await decode(uri);
  assert.ok(Math.abs(info.width - 50) <= 2 && Math.abs(info.height - 40) <= 2);
  assert.equal(px(data, info.width, 5, 5).a, 255);
});

test("fondo no uniforme: convierte a PNG sin inventar transparencia", async () => {
  const jpeg = await sharp({
    create: { width: 100, height: 60, channels: 3, background: "#ffffff" },
  })
    .composite([
      { input: await solid(50, 60, "#203040"), top: 0, left: 50 },
      { input: await solid(30, 30, "#0f5132"), top: 15, left: 35 },
    ])
    .jpeg()
    .toBuffer();

  const uri = await logoToDataUri(asFile(jpeg, "image/jpeg"));
  assert.ok(uri);
  const { data, info } = await decode(uri);
  // Esquinas opacas: no se removió nada.
  assert.equal(px(data, info.width, 0, 0).a, 255);
  assert.equal(px(data, info.width, info.width - 1, info.height - 1).a, 255);
});

test("fondo blanco con viñeta/gradiente suave también se quita", async () => {
  // Foto de stock típica: blanco arriba → gris ~200 abajo (esquinas NO
  // uniformes; un chequeo de esquinas iguales lo rechazaría).
  const w = 120,
    h = 120;
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    const v = Math.round(255 - (55 * y) / (h - 1));
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      raw[i] = raw[i + 1] = raw[i + 2] = v;
    }
  }
  const jpeg = await sharp(raw, { raw: { width: w, height: h, channels: 3 } })
    .composite([{ input: await solid(40, 40, "#0f5132"), top: 40, left: 40 }])
    .jpeg({ quality: 92 })
    .toBuffer();

  const uri = await logoToDataUri(asFile(jpeg, "image/jpeg"));
  assert.ok(uri);
  const { data, info } = await decode(uri);
  // Recorte al contenido ≈ el cuadrado verde, opaco.
  assert.ok(Math.abs(info.width - 40) <= 4 && Math.abs(info.height - 40) <= 4);
  assert.equal(px(data, info.width, info.width >> 1, info.height >> 1).a, 255);
});

test("archivo que no es imagen, vacío o gigante → null", async () => {
  assert.equal(await logoToDataUri(asFile(Buffer.from("no soy una imagen"))), null);
  assert.equal(await logoToDataUri(asFile(Buffer.alloc(0))), null);
  const huge = new File([new Uint8Array(11 * 1024 * 1024)], "big.png", {
    type: "image/png",
  });
  assert.equal(await logoToDataUri(huge), null);
});

test("imagen completa sin fondo sólido pero válida → PNG", async () => {
  const png = await solid(60, 60, "#0f5132");
  const uri = await logoToDataUri(asFile(png));
  assert.ok(uri);
  const { data, info } = await decode(uri);
  assert.equal(px(data, info.width, 0, 0).a, 255);
});
