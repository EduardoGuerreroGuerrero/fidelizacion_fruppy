import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { connection } from "next/server";
import { requireEnv } from "@/lib/env";

// Server client bound to the request's session cookie. All queries run as the
// signed-in user and are subject to RLS.
export async function createClient() {
  // Dato por petición: sin esto, Next (cacheComponents) intenta prerrenderizar
  // en el shell y el SDK de Supabase usa Date.now() → error en consola.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component: session refresh is handled
            // by middleware; cookies can't be set here.
          }
        },
      },
    },
  );
}

// Usuario autenticado de la petición, verificado contra Supabase Auth
// (getUser = ida y vuelta de red). cache(): layouts, página y helpers del
// mismo render comparten UNA llamada en vez de repetirla por segmento.
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Service-role client: bypasses RLS. ONLY for trusted server code
// (webhooks, jobs, wallet sync). Never import from client components and
// never let user-supplied organization_id/role reach a query unchecked.
export function supabaseAdmin() {
  return createSupabaseClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
