import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrgSettings } from "@/lib/admin/actions";

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
    .select("id, name, currency, timezone, brand")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const brand = (org.brand ?? {}) as { color?: string; logo_url?: string };
  const brandColor = brand.color ?? "#16a34a";

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
              Logo (URL https)
            </label>
            <input
              id="logo_url"
              name="logo_url"
              type="url"
              defaultValue={brand.logo_url ?? ""}
              className={input}
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
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
    </div>
  );
}
