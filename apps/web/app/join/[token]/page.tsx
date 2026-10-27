import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";

export const instant = false;

type JoinProgram = { id: string; name: string; program_type: string };

type JoinInfo = {
  ok: boolean;
  reason?: string;
  org_name?: string;
  programs?: JoinProgram[];
  brand_color?: string | null;
  logo_url?: string | null;
  privacy_email?: string | null;
  policy_url?: string | null;
  policy_text?: string | null;
  data_controller?: string | null;
  push_enabled?: boolean;
  location_enabled?: boolean;
};

const input =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

// Página pública de autorregistro por QR. El token identifica el comercio;
// el cliente NUNCA envía un merchant_id — lo resuelve el servidor.
export default async function JoinPage({
  params,
  searchParams,
}: PageProps<"/join/[token]">) {
  const { token } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const info = (await supabase
    .rpc("resolve_join", { p_token: token })
    .then((r) => r.data)) as JoinInfo | null;

  if (!info) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-white px-6">
        <p className="rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
          Este código QR no es válido. Pide ayuda en el comercio.
        </p>
      </main>
    );
  }

  if (!info.ok) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-white px-6">
        <p className="rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
          {info.reason === "no_program"
            ? "Este comercio aún no tiene un programa de fidelización activo."
            : info.reason === "no_privacy_channel"
              ? "Este comercio aún está terminando de configurar su política de privacidad. Vuelve a intentarlo más tarde o pide ayuda en el local."
              : "El registro por QR no está disponible en este momento."}
        </p>
      </main>
    );
  }

  const brand = info.brand_color && /^#[0-9a-fA-F]{6}$/.test(info.brand_color)
    ? info.brand_color
    : "#17b8a6";
  const controller = info.data_controller ?? info.org_name ?? "el comercio";
  const programs = info.programs ?? [];
  const multiProgram = programs.length > 1;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pb-10 pt-8">
      {/* Marca del comercio para que el cliente confirme dónde se registra */}
      <header className="flex flex-col items-center gap-2 text-center">
        {info.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={info.logo_url} alt="" className="h-12 w-auto rounded-xl object-contain" />
        ) : (
          <span
            className="flex size-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{ backgroundColor: brand }}
          >
            {(info.org_name ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}
        <h1 className="mt-1 text-xl font-semibold text-ink">{info.org_name}</h1>
        <p className="text-sm text-ink-soft">
          {multiProgram
            ? `Elige a qué programa${programs.length > 1 ? "s" : ""} de ${info.org_name} quieres unirte.`
            : `Únete a ${programs[0]?.name ?? "su programa"} y acumula ${
                programs[0]?.program_type === "points" ? "puntos" : "sellos"
              } en cada visita.`}
        </p>
      </header>

      {error ? (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <RememberForm storageKey="join-register" method="post" action={`/join/${token}/register`} className="mt-6 space-y-4">
        <div>
          <label htmlFor="first_name" className="mb-1.5 block text-sm font-medium text-ink">
            Nombre <span className="text-ink-soft">(obligatorio)</span>
          </label>
          <input
            id="first_name"
            name="first_name"
            required
            maxLength={80}
            autoComplete="given-name"
            placeholder="Tu nombre"
            className={input}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Correo electrónico <span className="text-ink-soft">(obligatorio)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            className={input}
          />
          <p className="mt-1 text-xs text-ink-soft">
            Para enviarte tu tarjeta y confirmar tu registro.
          </p>
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
            Celular <span className="text-ink-soft">(opcional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={32}
            autoComplete="tel"
            placeholder="+57 300 000 0000"
            className={input}
          />
        </div>

        {multiProgram ? (
          <fieldset className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
            <legend className="px-1 text-sm font-semibold text-ink">Programas</legend>
            <p className="mt-1 text-[12px] leading-snug text-ink-soft">
              Puedes unirte a uno o a varios — cada uno tiene su propia tarjeta y QR.
            </p>
            <div className="mt-2.5 space-y-2">
              {programs.map((p) => (
                <label
                  key={p.id}
                  className="flex items-start gap-2.5 text-[13px] leading-snug text-ink"
                >
                  <input
                    type="checkbox"
                    name="program_ids"
                    value={p.id}
                    defaultChecked
                    className="mt-0.5 size-4 shrink-0 accent-brand"
                  />
                  <span>
                    {p.name}{" "}
                    <span className="text-ink-soft">
                      ({p.program_type === "points" ? "puntos" : "sellos"})
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <input type="hidden" name="program_ids" value={programs[0]?.id ?? ""} />
        )}

        {/* Honeypot anti-spam: invisible para humanos, los bots lo rellenan */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Empresa
            <input name="empresa" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {/* Aviso de privacidad y decisiones separadas — marketing nunca
            viene premarcado */}
        <fieldset className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">
            Autorizaciones
          </legend>
          <label className="mt-2 flex items-start gap-2.5 text-[13px] leading-snug text-ink">
            <input
              type="checkbox"
              name="data_consent"
              required
              className="mt-0.5 size-4 shrink-0 accent-brand"
            />
            <span>
              Autorizo el tratamiento de mis datos personales por parte de{" "}
              <strong>{controller}</strong> para administrar el programa de
              fidelización, conforme a la{" "}
              <a
                href={
                  info.policy_url
                    ? info.policy_url
                    : `/join/${token}/privacidad`
                }
                target={info.policy_url ? "_blank" : undefined}
                rel={info.policy_url ? "noopener noreferrer" : undefined}
                className="font-medium text-brand underline"
              >
                política de tratamiento de datos
              </a>
              . <span className="text-ink-soft">(obligatorio)</span>
            </span>
          </label>
          <label className="mt-2.5 flex items-start gap-2.5 text-[13px] leading-snug text-ink">
            <input
              type="checkbox"
              name="marketing_consent"
              className="mt-0.5 size-4 shrink-0 accent-brand"
            />
            <span>
              Acepto recibir mensajes promocionales de {info.org_name} por
              correo electrónico.{" "}
              <span className="text-ink-soft">(opcional)</span>
            </span>
          </label>
          <p className="mt-3 text-[12px] leading-snug text-ink-soft">
            Al continuar también aceptas los{" "}
            <a
              href={`/join/${token}/terminos`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline"
            >
              términos y condiciones
            </a>{" "}
            del programa.
          </p>
          <p className="mt-3 text-[11px] leading-snug text-ink-soft">
            Podrás activar o retirar notificaciones y otros permisos desde tu
            tarjeta, en cualquier momento y por separado
            {info.privacy_email ? (
              <>
                {" "}
                o escribiendo a{" "}
                <a href={`mailto:${info.privacy_email}`} className="text-brand underline">
                  {info.privacy_email}
                </a>
              </>
            ) : (
              ""
            )}
            .
          </p>
        </fieldset>

        <SubmitButton
          className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white shadow-sm transition active:scale-[0.99]"
          style={{ backgroundColor: brand }}>
          Crear mi tarjeta
        </SubmitButton>
      </RememberForm>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-neutral-300">
        Powered by
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pineapple/isotipo.png" alt="" className="h-3.5 w-auto" />
        PineappleLoyalty — fidelización digital
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-[11px] text-neutral-300 underline-offset-2 hover:underline">
          ← Volver al inicio
        </Link>
      </p>
    </main>
  );
}
