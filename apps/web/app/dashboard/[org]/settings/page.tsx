import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  closeOrganization,
  deleteOrganization,
  updateOrgPrivacy,
  updateOrgSettings,
} from "@/lib/admin/actions";
import { defaultPolicyText } from "@/lib/legal/policy-template";
import { STAMP_ICON_OPTIONS } from "@/app/t/[token]/_components/stamp-icons";
import { ColorPicker } from "./color-picker";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";
import { DEFAULT_BRAND_COLOR } from "@/lib/brand";

export const instant = false;

const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";
const label = "mb-1 block text-sm font-medium";

const TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Buenos_Aires",
  "Europe/Madrid",
];

// Contraste WCAG del texto blanco de la tarjeta sobre el color de marca.
function contrastWithWhite(hex: string): number {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return 1.05 / (lum + 0.05);
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { org: slug } = await params;
  const { error, ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations!inner(slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("organizations.slug", slug)
    .maybeSingle();
  const isOwner = membership?.role === "owner";

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, currency, timezone, brand, legal, features")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const brand = (org.brand ?? {}) as {
    color?: string;
    logo_url?: string;
    stamp_icon?: string;
  };
  const brandColor = brand.color ?? DEFAULT_BRAND_COLOR;
  const brandContrast = /^#[0-9a-fA-F]{6}$/.test(brandColor)
    ? contrastWithWhite(brandColor)
    : 21;
  // Vista previa con la meta del programa activo (no un "8 / 9" inventado).
  const { data: activeProgram } = await supabase
    .from("loyalty_programs")
    .select("program_type, stamp_goal")
    .eq("organization_id", org.id)
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const previewGoal = activeProgram?.stamp_goal ?? 10;
  const previewIsStamps = !activeProgram || activeProgram.program_type === "stamps";
  const previewCurrent = Math.max(1, Math.round(previewGoal * 0.6));
  const stampIcon = brand.stamp_icon ?? "strawberry";
  const legal = (org.legal ?? {}) as {
    privacy_email?: string;
    data_controller?: string;
    consent_version?: string;
    policy_text?: string;
  };
  const features = (org.features ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Configuración</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {ok}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <RememberForm storageKey="settings-org" action={updateOrgSettings.bind(null, slug)} className="space-y-4">
          <div>
            {/* El nombre aquí ES el nombre registrado de la organización —
                única fuente de verdad: se usa igual en el panel, el QR,
                la tarjeta del cliente y el pase de Wallet. */}
            <label htmlFor="name" className={label}>
              Nombre del comercio
            </label>
            <input id="name" name="name" required defaultValue={org.name} className={input} />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div>
              <label htmlFor="currency" className={label}>
                Moneda
              </label>
              <input
                id="currency"
                name="currency"
                defaultValue={org.currency}
                maxLength={3}
                className={input}
              />
            </div>
            <div>
              <label htmlFor="timezone" className={label}>
                Zona horaria
              </label>
              <select id="timezone" name="timezone" defaultValue={org.timezone} className={input}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Color de tarjeta</label>
            <ColorPicker name="brand_color" defaultValue={brand.color ?? ""} />
          </div>
          <div>
            <label htmlFor="logo" className={label}>
              Logo del comercio
            </label>
            {brand.logo_url && (
              <div className="mb-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logo_url}
                  alt="Logo actual"
                  className="h-10 w-auto rounded border border-neutral-200 bg-white object-contain p-1 dark:border-neutral-700"
                />
                <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" name="remove_logo" className="accent-brand" />
                  Quitar logo actual
                </label>
              </div>
            )}
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 file:mr-3 file:rounded-full file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-xs file:font-semibold dark:border-neutral-700 dark:bg-transparent dark:text-neutral-400"
            />
            <p className="mt-1 text-xs text-ink-soft">
              PNG, JPG, WebP o SVG — máx. 10 MB. Si el fondo es de un solo
              color se quita automáticamente. Este mismo logo se usa en el
              panel, el formulario de registro por QR, la tarjeta del cliente
              y el pase de Google Wallet.
            </p>
          </div>

          <div>
            <label className={label}>Figura de los sellos</label>
            <div className="grid grid-cols-4 gap-2">
              {STAMP_ICON_OPTIONS.map(({ key, label: l, Icon }) => (
                <label
                  key={key}
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-neutral-200 p-2 text-center has-[:checked]:border-brand has-[:checked]:bg-brand/5 dark:border-neutral-700"
                >
                  <input
                    type="radio"
                    name="stamp_icon"
                    value={key}
                    defaultChecked={stampIcon === key}
                    className="sr-only"
                  />
                  <Icon filled className="size-6" />
                  <span className="text-xs leading-tight text-neutral-600 dark:text-neutral-400">
                    {l}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {STAMP_ICON_OPTIONS.find((o) => o.key === stampIcon)?.hint}
            </p>
          </div>

          <SubmitButton
            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper">
            Guardar configuración
          </SubmitButton>
        </RememberForm>

        <div>
          <h2 className="mb-2 text-sm font-medium">Vista previa de tarjeta</h2>
          <div
            className="rounded-2xl p-6 text-white shadow-sm"
            style={{ backgroundColor: brandColor }}
          >
            {brand.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo_url}
                alt="Logo"
                className="mb-3 h-8 w-auto rounded bg-white/80 object-contain"
              />
            )}
            <p className="text-xs uppercase tracking-wide opacity-80">{org.name}</p>
            <p className="mt-4 text-2xl font-semibold">
              {previewIsStamps ? `${previewCurrent} / ${previewGoal}` : "1.250"}
            </p>
            <p className="text-sm opacity-80">{previewIsStamps ? "sellos" : "puntos"}</p>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Así ven la tarjeta tus clientes (los números son un ejemplo).
          </p>
          {brandContrast < 4.5 && (
            <p
              role="status"
              className="mt-2 rounded-xl bg-pastel-cream px-3 py-2 text-xs text-[#8f5a1c]"
            >
              Con este color el texto blanco de la tarjeta se lee con dificultad
              (contraste {brandContrast.toFixed(1)}:1; lo recomendado es 4.5:1).
              Prueba un tono más oscuro.
            </p>
          )}
        </div>
      </div>

      {/* Privacidad y funciones por comercio (Ley 1581): responsable,
          canal de derechos, política propia y versión del texto de
          consentimiento. Los flags activan autorregistro QR, push y
          ubicación opcional. */}
      <form
        action={updateOrgPrivacy.bind(null, slug)}
        className="mt-8 space-y-4 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
      >
        <h2 className="font-medium">Privacidad y funciones</h2>
        <div>
          <label htmlFor="data_controller" className={label}>
            Responsable del tratamiento
          </label>
          <input
            id="data_controller"
            name="data_controller"
            defaultValue={legal.data_controller ?? ""}
            placeholder={org.name}
            className={input}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="privacy_email" className={label}>
              Correo de privacidad
            </label>
            <input
              id="privacy_email"
              name="privacy_email"
              type="email"
              defaultValue={legal.privacy_email ?? ""}
              placeholder="privacidad@tucomercio.com"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="consent_version" className={label}>
              Versión del consentimiento
            </label>
            <input
              id="consent_version"
              name="consent_version"
              defaultValue={legal.consent_version ?? "v1"}
              maxLength={40}
              className={input}
            />
          </div>
        </div>
        <div>
          <label htmlFor="policy_text" className={label}>
            Política de tratamiento de datos
          </label>
          <p className="mb-2 max-w-prose text-xs text-ink-soft">
            Se precarga un texto base que reconoce a {org.name || "tu comercio"}{" "}
            como responsable del tratamiento y a PineappleLoyalty como
            encargado técnico (Ley 1581 de 2012). Puedes editarlo libremente
            — esto reemplaza enlazar a una URL externa: el texto vigente
            queda guardado aquí y se muestra en el formulario de registro y
            en la tarjeta del cliente.
          </p>
          <textarea
            id="policy_text"
            name="policy_text"
            rows={14}
            defaultValue={legal.policy_text || defaultPolicyText(org.name)}
            className={input + " font-mono text-xs leading-relaxed"}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Funciones del comercio</legend>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="feat_self_registration"
              defaultChecked={features.self_registration !== false}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>
              Autorregistro por QR{" "}
              <span className="text-xs text-ink-soft">
                (los clientes se dan de alta desde el QR del local)
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="feat_push"
              defaultChecked={features.push === true}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>
              Notificaciones push{" "}
              <span className="text-xs text-ink-soft">
                (el cliente las activa por separado en su tarjeta)
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="feat_location"
              defaultChecked={features.location === true}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>
              Sedes cercanas{" "}
              <span className="text-xs text-ink-soft">
                (ubicación opcional del cliente, nunca se guarda)
              </span>
            </span>
          </label>
        </fieldset>

        <SubmitButton
          className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper">
          Guardar privacidad y funciones
        </SubmitButton>
      </form>
      {isOwner ? (
        <section className="mt-10 rounded-xl border border-red-200 p-5 dark:border-red-900">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Zona de peligro</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Solo el propietario ve esto. Para confirmar escribe el identificador de la
            organización: <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">{slug}</code>
          </p>

          <form action={closeOrganization.bind(null, slug)} className="mt-4 space-y-2">
            <p className="text-sm font-medium">Cerrar la organización</p>
            <p className="text-xs text-ink-soft">
              Revoca todas las tarjetas, apaga el QR de registro, borra las suscripciones push y
              cancela campañas pendientes. El historial de sellos y canjes se conserva. Desaparece de
              &quot;Mis organizaciones&quot;.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                name="confirm_slug"
                required
                autoComplete="off"
                placeholder={slug}
                aria-label="Escribe el identificador para confirmar el cierre"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
              />
              <SubmitButton
                pendingText="Cerrando…"
                confirm="¿Cerrar esta organización? Se revocan todas las tarjetas y el QR deja de funcionar. Esta acción no se puede deshacer desde el panel."
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
              >
                Cerrar organización
              </SubmitButton>
            </div>
          </form>

          <form action={deleteOrganization.bind(null, slug)} className="mt-6 space-y-2">
            <p className="text-sm font-medium">Eliminar definitivamente</p>
            <p className="text-xs text-ink-soft">
              Solo si la organización nunca tuvo sellos, visitas ni canjes (por ejemplo, la creaste
              por error). Si ya tiene historial, ciérrala.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                name="confirm_slug"
                required
                autoComplete="off"
                placeholder={slug}
                aria-label="Escribe el identificador para confirmar la eliminación"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
              />
              <SubmitButton
                pendingText="Eliminando…"
                confirm="¿Eliminar definitivamente esta organización y todos sus datos? No se puede deshacer."
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Eliminar organización
              </SubmitButton>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
