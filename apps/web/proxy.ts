import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16: "middleware" fue renombrado a "proxy". Este proxy refresca la
// sesión de Supabase y hace un chequeo OPTIMISTA de autenticación — la
// autorización real siempre se verifica en servidor (layouts/actions/RLS).
const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response; // Supabase no configurado aún

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims(): verifica la firma del JWT localmente (claves asimétricas
  // ES256, JWKS cacheado) y refresca la sesión si expiró. getUser() hacía
  // una ida y vuelta a Supabase Auth en CADA petición/navegación del panel.
  // Es solo el chequeo optimista: layouts, actions y RLS siguen verificando.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  const path = request.nextUrl.pathname;

  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && AUTH_PAGES.includes(path)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Rutas públicas de alto volumen (tarjeta del cliente, alta por QR, logos e
// imágenes del pase) no usan la sesión del panel: excluirlas evita una
// llamada a Supabase Auth y una invocación del proxy por cada petición.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|wallet-img|logo/|t/|join/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|mov)$).*)",
  ],
};
