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

export const env = {
  appEnv: process.env.APP_ENV ?? "local",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  isProd: process.env.APP_ENV === "production",
} as const;
