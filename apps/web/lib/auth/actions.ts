"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 8;

function fail(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!EMAIL_RE.test(email)) fail("/login", "Email inválido.");
  if (password.length < MIN_PASSWORD) fail("/login", "Contraseña demasiado corta.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail("/login", "Credenciales incorrectas.");

  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const terms = formData.get("terms");

  if (!EMAIL_RE.test(email)) fail("/signup", "Email inválido.");
  if (password.length < MIN_PASSWORD) {
    fail("/signup", `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  }
  if (terms !== "on") {
    fail("/signup", "Debes aceptar los términos y la política de privacidad.");
  }

  const metadata = Object.fromEntries(
    (
      [
        ["full_name", formData.get("full_name")],
        ["business", formData.get("business")],
        ["business_type", formData.get("business_type")],
        ["country", formData.get("country")],
        ["city", formData.get("city")],
      ] as const
    )
      .map(([k, v]) => [k, String(v ?? "").trim()] as const)
      .filter(([, v]) => v !== ""),
  );

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) fail("/signup", "No se pudo crear la cuenta. Intenta con otro email.");

  redirect("/dashboard");
}

// OAuth con Google: Supabase redirige a Google y luego a /auth/callback.
// Requiere el provider habilitado en Supabase + las Redirect URLs
// registradas (…/auth/callback en prod y localhost).
export async function signInWithGoogle(formData: FormData) {
  const next = String(formData.get("next") ?? "/dashboard");
  const from = String(formData.get("from") ?? "/login");
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const safeFrom = from === "/signup" ? "/signup" : "/login";

  const h = await headers();
  const origin =
    h.get("origin") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });
  if (error || !data.url) {
    fail(safeFrom, "No se pudo iniciar con Google. Intenta de nuevo.");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
