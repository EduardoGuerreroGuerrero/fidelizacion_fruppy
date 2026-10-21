import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // La vista previa del IDE proxifica localhost bajo 127.0.0.1: sin esto,
  // Next dev bloquea /_next/hmr y la página nunca se hidrata.
  allowedDevOrigins: ["127.0.0.1"],
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
