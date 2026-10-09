import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProgram, setProgramStatus } from "@/lib/admin/actions";

export const instant = false;

const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

export default async function ProgramsPage({
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

  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("id, name, program_type, stamp_goal, points_per_currency_unit, status")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Programas</h1>

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

      <section className="mb-8 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-3 font-medium">Nuevo programa</h2>
        <form action={saveProgram.bind(null, slug)} className="grid gap-3 sm:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Nombre (ej. Café de la casa)"
            className={input + " sm:col-span-2"}
          />
          <select name="program_type" className={input} defaultValue="stamps">
            <option value="stamps">Sellos</option>
            <option value="points">Puntos</option>
          </select>
          <input
            name="stamp_goal"
            type="number"
            min={1}
            max={1000}
            placeholder="Meta (sellos)"
            className={input}
          />
          <input
            name="points_per_currency_unit"
            type="number"
            step="0.0001"
            min={0}
            placeholder="Pts por $ (puntos)"
            className={input + " sm:col-span-2"}
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 sm:col-span-2"
          >
            Crear programa
          </button>
        </form>
      </section>

      <ul className="space-y-3">
        {(programs ?? []).map((p) => (
          <li
            key={p.id}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {p.name}
                  <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                    {p.program_type}
                  </span>
                  {p.status !== "active" && (
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                      {p.status}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {p.program_type === "stamps"
                    ? `Meta: ${p.stamp_goal} sellos`
                    : `${p.points_per_currency_unit} pts por unidad de moneda`}
                </p>
              </div>
              <form
                action={setProgramStatus.bind(
                  null,
                  slug,
                  p.id,
                  p.status === "active" ? "archived" : "active",
                )}
              >
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {p.status === "active" ? "Archivar" : "Reactivar"}
                </button>
              </form>
            </div>

            <form action={saveProgram.bind(null, slug)} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="program_type" value={p.program_type} />
              <input name="name" defaultValue={p.name} className={input} required />
              {p.program_type === "stamps" ? (
                <input
                  name="stamp_goal"
                  type="number"
                  min={1}
                  max={1000}
                  defaultValue={p.stamp_goal ?? 9}
                  className={input + " w-28"}
                />
              ) : (
                <input
                  name="points_per_currency_unit"
                  type="number"
                  step="0.0001"
                  min={0}
                  defaultValue={p.points_per_currency_unit ?? 1}
                  className={input + " w-32"}
                />
              )}
              <button
                type="submit"
                className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Guardar
              </button>
            </form>
          </li>
        ))}
        {(programs ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            Sin programas todavía.
          </li>
        )}
      </ul>
    </div>
  );
}
