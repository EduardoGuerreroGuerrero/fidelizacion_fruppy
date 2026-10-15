import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrgPrivacy, updateOrgSettings } from "@/lib/admin/actions";

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

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, currency, timezone, brand, legal, features")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const brand = (org.brand ?? {}) as { color?: string; logo_url?: string };
  const brandColor = brand.color ?? "#16a34a";
  const legal = (org.legal ?? {}) as {
    privacy_email?: string;
    policy_url?: string;
    data_controller?: string;
    consent_version?: string;
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
        <form action={updateOrgSettings.bind(null, slug)} className="space-y-4">
          <div>
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
            <label htmlFor="brand_color" className={label}>
              Color de tarjeta (#RRGGBB)
            </label>
            <input
              id="brand_color"
              name="brand_color"
              defaultValue={brand.color ?? ""}
              placeholder="#16a34a"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="logo_url" className={label}>
              Logo (URL https o PNG subido)
            </label>
            <input
              id="logo_url"
              name="logo_url"
              type="text"
              defaultValue={brand.logo_url ?? ""}
              className={input}
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Guardar configuración
          </button>
        </form>

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
            <p className="mt-4 text-2xl font-semibold">8 / 9</p>
            <p className="text-sm opacity-80">sellos</p>
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Así se ve la tarjeta web del cliente en /t/…
          </p>
        </div>
      </div>

      {/* Privacidad y funciones por comercio (Ley 1581): responsable,
          canal de derechos, política y versión del texto de consentimiento.
          Los flags activan autorregistro QR, push y ubicación opcional. */}
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
          <label htmlFor="policy_url" className={label}>
            URL de la política de tratamiento (https)
          </label>
          <input
            id="policy_url"
            name="policy_url"
            type="url"
            defaultValue={legal.policy_url ?? ""}
            className={input}
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
              <span className="text-xs text-neutral-500">
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
              <span className="text-xs text-neutral-500">
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
              <span className="text-xs text-neutral-500">
                (ubicación opcional del cliente, nunca se guarda)
              </span>
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          Guardar privacidad y funciones
        </button>
      </form>
    </div>
  );
}
