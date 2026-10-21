// Centralized access to environment variables with validation.
// Server-only vars must never be read from client components.

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

// APP_ENV manda; si no está definida se infiere del hosting (Vercel expone
// VERCEL_ENV = production | preview | development) y, en último caso, de
// NODE_ENV. Evita que producción se reporte como "local".
const appEnv =
  process.env.APP_ENV ??
  process.env.VERCEL_ENV ??
  (process.env.NODE_ENV === "production" ? "production" : "local");

export const env = {
  appEnv,
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  isProd: appEnv === "production",
} as const;
