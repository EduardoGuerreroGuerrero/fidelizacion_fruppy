import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback OAuth: Supabase (Google) redirige aquí con ?code=... que se
// intercambia por la sesión del usuario. `next` viene saneado del action.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No se pudo iniciar sesión con Google.")}`,
  );
}
