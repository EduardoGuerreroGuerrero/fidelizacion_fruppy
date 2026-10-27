import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { enqueueEmail, trySendOutbox } from "@/lib/email/outbox";

// Alta pública por QR. El token del URL resuelve el comercio EN SERVIDOR;
// el cliente nunca puede elegir organization_id. El correo transaccional va
// por la cola (email_outbox): el registro no depende del proveedor.

type RegisterCard = {
  token: string;
  program_id: string;
  program_name: string;
  program_type: string;
};

type RegisterResult = {
  ok: boolean;
  error?: string;
  existing?: boolean;
  cards?: RegisterCard[];
  customer_id?: string;
  org_name?: string;
  email?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  // Programas elegidos por el cliente en /join/{token}. El servidor vuelve a
  // validar que sean activos y de ESTE comercio (nunca confía en el cliente);
  // si no llega ninguno válido, la RPC cae al respaldo histórico.
  const programIds = form
    .getAll("program_ids")
    .map((v) => String(v))
    .filter((v) => UUID_RE.test(v));

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("register_customer_via_join", {
    p_token: token,
    p_first_name: firstName,
    p_email: email,
    p_phone: phone || null,
    p_marketing: marketing,
    p_client_hash: clientHash(req),
    p_idempotency_key: idem,
    ...(programIds.length ? { p_program_ids: programIds } : {}),
  });
  const r = (result ?? null) as RegisterResult | null;

  if (error || !r?.ok) {
    const code = r?.error ?? "unknown";
    const msg = ERROR_MSG[code] ?? "No se pudo completar el registro. Inténtalo de nuevo.";
    return NextResponse.redirect(back + "?error=" + encodeURIComponent(msg), 303);
  }

  const admin = supabaseAdmin();

  if (r.existing) {
    // Ya registrado: la RPC no revela tokens en la respuesta (es ejecutable
    // por `anon`; hacerlo permitiría enumerar la tarjeta de alguien más con
    // solo adivinar su correo). Aquí, con el service role, se buscan EXACTA-
    // MENTE las tarjetas de los programas que el cliente marcó en el
    // formulario (fallback: todas sus tarjetas activas de este comercio, si
    // por algún motivo no llegó ninguna selección válida) y se envían por
    // correo — nunca una tarjeta de un programa distinto al elegido.
    if (r.customer_id && email) {
      const { data: customer } = await admin
        .from("customers")
        .select("organization_id, first_name")
        .eq("id", r.customer_id)
        .maybeSingle();
      if (customer) {
        let query = admin
          .from("customer_cards")
          .select("token, loyalty_accounts!inner(program_id, loyalty_programs(name))")
          .eq("customer_id", r.customer_id)
          .eq("organization_id", customer.organization_id)
          .eq("status", "active");
        if (programIds.length) {
          query = query.in("loyalty_accounts.program_id", programIds);
        }
        const { data: matchingCards } = await query;
        for (const card of matchingCards ?? []) {
          const acc = Array.isArray(card.loyalty_accounts)
            ? card.loyalty_accounts[0]
            : card.loyalty_accounts;
          const prog = Array.isArray(acc?.loyalty_programs)
            ? acc?.loyalty_programs[0]
            : acc?.loyalty_programs;
          if (!card.token) continue;
          const { queued, id } = await enqueueEmail({
            orgId: customer.organization_id,
            customerId: r.customer_id,
            kind: "card_delivery",
            toEmail: email.toLowerCase(),
            payload: {
              first_name: customer.first_name,
              org_name: r.org_name,
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

  // La RPC solo devuelve tokens para alta nueva — ahí sí, exactamente los
  // programas que el cliente marcó en el formulario.
  const cards = r.cards ?? [];

  // Alta nueva: correo de bienvenida por cada programa seleccionado,
  // encolado + intento inmediato. Aterriza directo en la tarjeta principal
  // (la primera seleccionada); las demás llegan solo por correo.
  if (cards.length && r.customer_id && r.email) {
    const { data: customer } = await admin
      .from("customers")
      .select("organization_id")
      .eq("id", r.customer_id)
      .maybeSingle();
    if (customer) {
      for (const card of cards) {
        const { queued, id } = await enqueueEmail({
          orgId: customer.organization_id,
          customerId: r.customer_id,
          kind: "welcome_card",
          toEmail: r.email,
          payload: {
            first_name: firstName,
            org_name: r.org_name,
            program_name: card.program_name,
            card_token: card.token,
          },
          idempotencyKey: `welcome:${r.customer_id}:${card.token}`,
        });
        if (queued && id) await trySendOutbox(id);
      }
    }
    return NextResponse.redirect(`${baseUrl}/t/${cards[0].token}?bienvenida=1`, 303);
  }

  return NextResponse.redirect(back, 303);
}
