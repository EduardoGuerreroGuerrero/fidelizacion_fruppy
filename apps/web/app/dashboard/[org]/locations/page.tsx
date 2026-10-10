import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveLocation, setLocationStatus } from "@/lib/admin/actions";

export const instant = false;

const input =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

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
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, address, status")
    .eq("organization_id", org.id)
    .order("created_at");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Sedes</h1>

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

      <section className="mb-6 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-3 font-medium">Nueva sede</h2>
        <form action={saveLocation.bind(null, slug)} className="flex flex-wrap gap-2">
          <input
            name="name"
            required
            placeholder="Nombre (ej. Sede Centro)"
            className={input + " flex-1"}
          />
          <input name="address" placeholder="Dirección" className={input + " flex-1"} />
          <button
            type="submit"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Crear
          </button>
        </form>
      </section>

      <ul className="space-y-2">
        {(locations ?? []).map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {l.name}
                  {l.status !== "active" && (
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                      {l.status}
                    </span>
                  )}
                </p>
                <p className="text-sm text-neutral-500">{l.address ?? "—"}</p>
              </div>
              <form
                action={setLocationStatus.bind(
                  null,
                  slug,
                  l.id,
                  l.status === "active" ? "inactive" : "active",
                )}
              >
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {l.status === "active" ? "Desactivar" : "Activar"}
                </button>
              </form>
            </div>
            <form action={saveLocation.bind(null, slug)} className="mt-2 flex gap-2">
              <input type="hidden" name="id" value={l.id} />
              <input name="name" defaultValue={l.name} className={input} />
              <input name="address" defaultValue={l.address ?? ""} className={input} />
              <button
                type="submit"
                className="shrink-0 rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Guardar
              </button>
            </form>
          </li>
        ))}
        {(locations ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            Sin sedes. Crea la primera.
          </li>
        )}
      </ul>
    </div>
  );
}
