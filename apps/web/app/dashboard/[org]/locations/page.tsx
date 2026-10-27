import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveLocation, setLocationStatus, syncLocationsToWallet } from "@/lib/admin/actions";
import { walletProvider } from "@/lib/wallet/passlet";
import { MAX_WALLET_LOCATIONS, toWalletLocations, validCoords } from "@/lib/wallet/locations";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";
import { statusLabel } from "@/lib/labels";

export const instant = false;

const input =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default async function LocationsPage({
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
    .select("id, name, features")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, address, status, lat, lng")
    .eq("organization_id", org.id)
    .order("created_at");

  const proximityOn =
    ((org.features ?? {}) as Record<string, unknown>).wallet_proximity === true;
  const walletReady = walletProvider.googleEnabled();
  const all = locations ?? [];
  const { locations: publishable, overLimit } = toWalletLocations(all, org.name);
  const noCoords = all.filter((l) => l.status === "active" && !validCoords(l.lat, l.lng)).length;
  const { count: passCount } = await supabase
    .from("wallet_passes")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .eq("provider", "google");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Sedes</h1>

      <section className="mb-6 rounded-lg border border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">Proximidad en Google Wallet</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              proximityOn ?"bg-brand-soft text-brand" : "bg-neutral-100 text-ink-soft"
            }`}
          >
            {proximityOn ? "Activada" : "Desactivada"}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-ink-soft">Sedes publicables</dt>
            <dd className="font-semibold tabular-nums">
              {publishable.length}/{MAX_WALLET_LOCATIONS}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Sin coordenadas</dt>
            <dd className="font-semibold tabular-nums">{noCoords}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Pases de Google</dt>
            <dd className="font-semibold tabular-nums">{passCount ?? "—"}</dd>
          </div>
        </dl>
        {overLimit > 0 ? (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Google admite máximo {MAX_WALLET_LOCATIONS} ubicaciones por tarjeta: {overLimit} sede(s) quedan fuera.
          </p>
        ) : null}
        {!walletReady ? (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Google Wallet no está configurado en el servidor.
          </p>
        ) : null}
        <p className="mt-3 text-xs leading-snug text-ink-soft">
          Publicamos <strong>dónde están tus sedes</strong> en la tarjeta. Google Wallet decide si y cuándo
          mostrar un aviso cuando el cliente pasa cerca, según los permisos y ajustes de su teléfono; no
          podemos activarlo ni saber dónde está el cliente. El texto del aviso lo define Google.
          Se activa en Configuración → Privacidad y funciones.
        </p>
        {proximityOn ? (
          <form action={syncLocationsToWallet.bind(null, slug)} className="mt-3">
            <SubmitButton
              disabled={!walletReady}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              Sincronizar con Wallet
            </SubmitButton>
          </form>
        ) : null}
      </section>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          {ok}
        </p>
      )}

      <section className="mb-6 rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-3 font-medium">Nueva sede</h2>
        <RememberForm storageKey="location-new" action={saveLocation.bind(null, slug)} className="flex flex-wrap gap-2">
          <input
            name="name"
            required
            placeholder="Nombre (ej. Sede Centro)"
            className={input + " flex-1"}
          />
          <input name="address" placeholder="Dirección" className={input + " flex-1"} />
          <input
            name="lat"
            placeholder="Lat (opcional)"
            inputMode="decimal"
            className={input + " w-28"}
          />
          <input
            name="lng"
            placeholder="Lng (opcional)"
            inputMode="decimal"
            className={input + " w-28"}
          />
          <SubmitButton
            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper">
            Crear
          </SubmitButton>
        </RememberForm>
        <p className="mt-2 text-xs text-ink-soft">
          Con latitud/longitud el cliente puede ordenar las sedes por
          cercanía (opcional, se calcula en su dispositivo).
        </p>
      </section>

      <ul className="space-y-2">
        {(locations ?? []).map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-neutral-200 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {l.name}
                  {l.status !== "active" && (
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-ink-soft">
                      {statusLabel(l.status)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-ink-soft">{l.address ?? "—"}</p>
              </div>
              <form
                action={setLocationStatus.bind(
                  null,
                  slug,
                  l.id,
                  l.status === "active" ? "inactive" : "active",
                )}
              >
                <SubmitButton
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100">
                  {l.status === "active" ? "Desactivar" : "Activar"}
                </SubmitButton>
              </form>
            </div>
            <form action={saveLocation.bind(null, slug)} className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={l.id} />
              <input name="name" defaultValue={l.name} className={input} />
              <input name="address" defaultValue={l.address ?? ""} className={input} />
              <input
                name="lat"
                defaultValue={l.lat ?? ""}
                placeholder="Lat"
                inputMode="decimal"
                className={input + " w-24"}
              />
              <input
                name="lng"
                defaultValue={l.lng ?? ""}
                placeholder="Lng"
                inputMode="decimal"
                className={input + " w-24"}
              />
              <SubmitButton
                className="shrink-0 rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100">
                Guardar
              </SubmitButton>
            </form>
          </li>
        ))}
        {(locations ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-ink-soft">
            Sin sedes. Crea la primera.
          </li>
        )}
      </ul>
    </div>
  );
}
