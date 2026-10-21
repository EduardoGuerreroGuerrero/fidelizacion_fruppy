import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { enqueueEmail, trySendOutbox } from "@/lib/email/outbox";

// Alta pública por QR. El token del URL resuelve el comercio EN SERVIDOR;
// el cliente nunca puede elegir organization_id. El correo transaccional va
// por la cola (email_outbox): el registro no depende del proveedor.

type RegisterResult = {
  ok: boolean;
  error?: string;
  existing?: boolean;
  card_token?: string;
  customer_id?: string;
  org_name?: string;
  email?: string;
};

const ERROR_MSG: Record<string, string> = {
  join_invalid: "Este código QR no es válido.",
  join_disabled: "El registro por QR no está disponible en este comercio.",
  no_program: "Este comercio aún no tiene un programa activo.",
  rate_limited: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
  invalid_name: "Escribe tu nombre (máx. 80 caracteres).",
  invalid_email: "Revisa tu correo electrónico.",
  invalid_phone: "Revisa tu número de celular.",
};

function clientHash(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  // Hash de IP+UA para el rate limit: la IP nunca se guarda en claro.
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 40);
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  // Origen de la petición (no NEXT_PUBLIC_BASE_URL): local y previews no saltan a producción.
  const baseUrl = new URL(req.url).origin;
  const back = `${baseUrl}/join/${token}`;
  const done = `${baseUrl}/join/${token}/done`;

  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.redirect(back, 303);
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.redirect(back, 303);

  // Honeypot: un bot rellena el campo oculto → éxito fingido sin escribir.
  if (String(form.get("empresa") ?? "").trim() !== "") {
    return NextResponse.redirect(done, 303);
  }
  // El consentimiento de tratamiento es obligatorio para el alta.
  if (form.get("data_consent") !== "on") {
    return NextResponse.redirect(
      back + "?error=" + encodeURIComponent("Debes autorizar el tratamiento de datos."),
      303,
    );
  }

  const firstName = String(form.get("first_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const marketing = form.get("marketing_consent") === "on";
  const idem = String(form.get("idem") ?? "").trim() || null;

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("register_customer_via_join", {
    p_token: token,
    p_first_name: firstName,
    p_email: email,
    p_phone: phone || null,
    p_marketing: marketing,
    p_client_hash: clientHash(req),
    p_idempotency_key: idem,
  });
  const r = (result ?? null) as RegisterResult | null;

  if (error || !r?.ok) {
    const code = r?.error ?? "unknown";
    const msg = ERROR_MSG[code] ?? "No se pudo completar el registro. Inténtalo de nuevo.";
    return NextResponse.redirect(back + "?error=" + encodeURIComponent(msg), 303);
  }

  const admin = supabaseAdmin();

  if (r.existing) {
    // Ya registrado: no revelamos la tarjeta; le enviamos el enlace al
    // correo en archivo (mismo correo normalizado que acaba de escribir).
    if (r.customer_id && email) {
      const { data: customer } = await admin
        .from("customers")
        .select("organization_id, first_name, organizations(name)")
        .eq("id", r.customer_id)
        .maybeSingle();
      if (customer) {
        const { data: card } = await admin
          .from("customer_cards")
          .select("token, loyalty_accounts(loyalty_programs(name))")
          .eq("customer_id", r.customer_id)
          .eq("organization_id", customer.organization_id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        const acc = Array.isArray(card?.loyalty_accounts)
          ? card?.loyalty_accounts[0]
          : card?.loyalty_accounts;
        const prog = Array.isArray(acc?.loyalty_programs)
          ? acc?.loyalty_programs[0]
          : acc?.loyalty_programs;
        const org = Array.isArray(customer.organizations)
          ? customer.organizations[0]
          : customer.organizations;
        if (card?.token) {
          const { queued, id } = await enqueueEmail({
            orgId: customer.organization_id,
            customerId: r.customer_id,
            kind: "card_delivery",
            toEmail: email.toLowerCase(),
            payload: {
              first_name: customer.first_name,
              org_name: org?.name ?? r.org_name,
              program_name: prog?.name,
              card_token: card.token,
            },
            idempotencyKey: `reissue:${r.customer_id}:${card.token}`,
          });
          if (queued && id) await trySendOutbox(id);
        }
      }
    }
    return NextResponse.redirect(done, 303);
  }

  // Alta nueva: correo de bienvenida encolado + intento inmediato.
  if (r.card_token && r.customer_id && r.email) {
    const { data: customer } = await admin
      .from("customers")
      .select("organization_id")
      .eq("id", r.customer_id)
      .maybeSingle();
    if (customer) {
      const { queued, id } = await enqueueEmail({
        orgId: customer.organization_id,
        customerId: r.customer_id,
        kind: "welcome_card",
        toEmail: r.email,
        payload: {
          first_name: firstName,
          org_name: r.org_name,
          card_token: r.card_token,
        },
        idempotencyKey: `welcome:${r.customer_id}:${r.card_token}`,
      });
      if (queued && id) await trySendOutbox(id);
    }
    return NextResponse.redirect(`${baseUrl}/t/${r.card_token}?bienvenida=1`, 303);
  }

  return NextResponse.redirect(back, 303);
}
