"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client: uses ONLY the publishable anon key. Row Level Security
// is the authorization boundary — this client can never bypass it.
// NEXT_PUBLIC_* vars must be read statically so Next.js inlines them
// in the client bundle.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient(url, anonKey);
}
