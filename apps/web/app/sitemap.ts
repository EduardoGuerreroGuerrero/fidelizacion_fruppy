import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...[
      "/preguntas",
      "/contacto",
      "/guias",
      "/guias/configurar-programa",
      "/guias/registro-qr",
      "/guias/campanas",
      "/guias/reportes",
    ].map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...["/legal/terminos", "/legal/privacidad", "/legal/datos"].map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
