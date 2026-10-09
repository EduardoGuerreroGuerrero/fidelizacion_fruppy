"use server";

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

  if (!EMAIL_RE.test(email)) fail("/signup", "Email inválido.");
  if (password.length < MIN_PASSWORD) {
    fail("/signup", `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) fail("/signup", "No se pudo crear la cuenta. Intenta con otro email.");

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
