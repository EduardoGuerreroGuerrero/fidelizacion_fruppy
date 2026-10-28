import { notFound, redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { deleteProgram, saveProgram, setProgramStatus } from "@/lib/admin/actions";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";
import { programTypeLabel, statusLabel } from "@/lib/labels";

export const instant = false;

const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

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
  const user = await getAuthUser();
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

  // Resumen de eliminación de los archivados (solo owner/admin lo reciben; si
  // la función aún no existe en la base, simplemente no se ofrece eliminar).
  type DeleteSummary = {
    ok?: boolean;
    can_delete?: boolean;
    reason?: string;
    accounts?: number;
    cards?: number;
    rewards?: number;
    passes?: number;
  };
  const summaries = new Map<string, DeleteSummary>();
  await Promise.all(
    (programs ?? [])
      .filter((p) => p.status === "archived")
      .map(async (p) => {
        const { data } = await supabase.rpc("program_delete_summary", { p_program_id: p.id });
        if ((data as DeleteSummary | null)?.ok) summaries.set(p.id, data as DeleteSummary);
      }),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Programas</h1>

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

      <section className="mb-8 rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-3 font-medium">Nuevo programa</h2>
        <RememberForm storageKey="program-new" action={saveProgram.bind(null, slug)} className="grid gap-3 sm:grid-cols-4">
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
          <SubmitButton
            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper sm:col-span-2">
            Crear programa
          </SubmitButton>
        </RememberForm>
      </section>

      <ul className="space-y-3">
        {(programs ?? []).map((p) => (
          <li
            key={p.id}
            className="rounded-lg border border-neutral-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {p.name}
                  <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs">
                    {programTypeLabel(p.program_type)}
                  </span>
                  {p.status !== "active" && (
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-ink-soft">
                      {statusLabel(p.status)}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
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
                <SubmitButton
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100">
                  {p.status === "active" ? "Archivar" : "Reactivar"}
                </SubmitButton>
              </form>
            </div>

            {(() => {
              const s = summaries.get(p.id);
              if (!s) return null;
              if (!s.can_delete)
                return (
                  <p className="mt-2 text-xs text-ink-soft">
                    Tiene historial de movimientos: permanece archivado (no se puede eliminar).
                  </p>
                );
              return (
                <details className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
                  <summary className="cursor-pointer font-medium text-red-900">Eliminar programa…</summary>
                  <p className="mt-2 text-xs text-red-900">
                    Se eliminarán {s.accounts ?? 0} cuenta(s), {s.cards ?? 0} tarjeta(s),{" "}
                    {s.rewards ?? 0} premio(s) y {s.passes ?? 0} pase(s) de Wallet de este programa.
                    Los clientes siguen en tu CRM. No se puede deshacer.
                  </p>
                  <form action={deleteProgram.bind(null, slug, p.id)} className="mt-2 flex flex-wrap gap-2">
                    <input
                      name="confirm_name"
                      required
                      placeholder={`Escribe «${p.name}» para confirmar`}
                      className={input + " flex-1"}
                    />
                    <SubmitButton
                      className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                      confirm="¿Eliminar el programa definitivamente?"
                    >
                      Eliminar
                    </SubmitButton>
                  </form>
                </details>
              );
            })()}

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
              <SubmitButton
                className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100">
                Guardar
              </SubmitButton>
            </form>
          </li>
        ))}
        {(programs ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-ink-soft">
            Sin programas todavía.
          </li>
        )}
      </ul>
    </div>
  );
}
