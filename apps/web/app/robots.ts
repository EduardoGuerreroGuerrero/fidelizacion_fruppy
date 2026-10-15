import type { MetadataRoute } from "next";

// Solo la landing es indexable; el resto de la app es privada o efímera
// (dashboard autenticado, tarjetas personales, joins por token, APIs).
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/t/", "/join/", "/api/", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
