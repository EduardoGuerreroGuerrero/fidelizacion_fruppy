"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actionIp } from "@/lib/ratelimit";
import { ANTIBOT_MESSAGE, verifyAntiBot } from "@/lib/antibot";

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
  if (error) {
    if (error.code === "email_not_confirmed") {
      fail("/login", "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja.");
    }
    fail("/login", "Credenciales incorrectas.");
  }

  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signUp(formData: FormData) {
  if (!(await verifyAntiBot(formData, await actionIp())).ok) fail("/signup", ANTIBOT_MESSAGE);

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

  const h = await headers();
  const origin =
    h.get("origin") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
    },
  });
  if (error) fail("/signup", "No se pudo crear la cuenta. Intenta con otro email.");

  // Email ya registrado: Supabase no da error (anti-enumeración) pero devuelve
  // un usuario sin identities y sin sesión.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    fail("/signup", "Ese email ya está registrado. Inicia sesión.");
  }

  // Con "Confirm email" activo en Supabase no hay sesión hasta confirmar:
  // mandar a /dashboard rebotaba a /login y el login fallaba.
  if (!data.session) {
    redirect(
      `/login?notice=${encodeURIComponent(
        "Te enviamos un correo de confirmación. Confírmalo y luego inicia sesión.",
      )}`,
    );
  }

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

// Recuperación de contraseña. Respuesta SIEMPRE genérica (no revela si el
// correo existe). El enlace del correo vuelve a /auth/callback (PKCE: debe
// abrirse en el mismo navegador) y de ahí a /nueva-clave.
export async function requestPasswordReset(formData: FormData) {
  if (!(await verifyAntiBot(formData, await actionIp())).ok) fail("/recuperar", ANTIBOT_MESSAGE);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) fail("/recuperar", "Email inválido.");

  const h = await headers();
  const origin =
    h.get("origin") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/nueva-clave")}`,
  });
  // Límite de envíos de Supabase: sí se avisa, para que no reintente en bucle.
  if (error?.code === "over_email_send_rate_limit" || error?.status === 429) {
    fail("/recuperar", "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.");
  }

  redirect(
    `/recuperar?notice=${encodeURIComponent(
      "Si ese correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Ábrelo en este mismo navegador.",
    )}`,
  );
}

// Fija la contraseña nueva. Exige la sesión de recuperación creada por el
// callback; sin ella (enlace vencido o abierto en otro navegador) no hace nada.
export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD) {
    fail("/nueva-clave", `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  }
  if (password !== confirm) fail("/nueva-clave", "Las contraseñas no coinciden.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    fail("/recuperar", "El enlace venció o se abrió en otro navegador. Solicita uno nuevo.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    fail(
      "/nueva-clave",
      error.code === "same_password"
        ? "La contraseña nueva debe ser distinta de la anterior."
        : error.code === "weak_password"
          ? "Esa contraseña es demasiado débil. Usa una más larga o variada."
          : "No se pudo actualizar la contraseña. Intenta de nuevo.",
    );
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
