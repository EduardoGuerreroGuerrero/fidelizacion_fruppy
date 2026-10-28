import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP EN CUMPLIMIENTO (no Report-Only). Enforcea default-src/object-src/
// base-uri/frame-ancestors/form-action y las allowlists de connect/img.
// `script-src`/`style-src` conservan 'unsafe-inline' porque Next inyecta
// scripts y estilos en línea sin nonce, y un nonce por petición es
// incompatible con el render estático/PPR de este proyecto (el shell
// prerenderizado no recibe nonce) y con el proxy, que excluye las rutas
// públicas de cliente (/t, /join, logo, wallet-img) por rendimiento.
// Quitar 'unsafe-inline' de script-src exige la migración a nonce descrita
// en docs/SECURITY_AUDIT_2026-10.md §4. 'unsafe-eval' solo en dev (HMR).
// Verificado: la app no carga scripts/estilos/fuentes externos (solo self +
// Supabase + FCM en connect-src); las URLs de Wallet son navegaciones.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  // Turnstile (anti-bot de formularios públicos) se muestra en un iframe.
  "frame-src https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS: fuerza HTTPS en el navegador tras la primera visita (evita
  // SSL-strip). 2 años + subdominios + preload. Seguro: la app solo se sirve
  // por HTTPS en Vercel.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Aislamiento de ventana y endurecimiento adicional. No se añade COEP/CORP
  // para no romper la carga de imágenes https:/data: del pase y los logos.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Cámara solo del propio sitio (escáner de QR); geolocalización para
  // "sedes cercanas"; nada de micrófono ni pagos.
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  /* config options here */
  // La vista previa del IDE proxifica localhost bajo 127.0.0.1: sin esto,
  // Next dev bloquea /_next/hmr y la página nunca se hidrata.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // El logo del comercio acepta imágenes de hasta 10 MB (se convierten y
    // normalizan a PNG ≤256 KB en el servidor).
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
