import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteReward, saveReward, setRewardStatus } from "@/lib/admin/actions";
import { displayName } from "@/lib/format";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";
import { programTypeLabel, statusLabel } from "@/lib/labels";

export const instant = false;

const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default async function RewardsPage({
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

  const [{ data: programs }, { data: rewards }, { data: redemptions }] = await Promise.all([
    supabase
      .from("loyalty_programs")
      .select("id, name, program_type")
      .eq("organization_id", org.id)
      .eq("status", "active"),
    supabase
      .from("rewards")
      .select("id, name, cost_stamps, cost_points, status, program_id")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("redemptions")
      .select("id, created_at, status, rewards(name), customers(first_name, last_name)")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const programName = new Map((programs ?? []).map((p) => [p.id, p.name]));
  const programType = new Map((programs ?? []).map((p) => [p.id, p.program_type]));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Recompensas</h1>

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
        <h2 className="mb-3 font-medium">Nueva recompensa</h2>
        <RememberForm storageKey="reward-new" action={saveReward.bind(null, slug)} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Nombre" className={input} />
          <select name="program_id" required className={input}>
            <option value="">Programa…</option>
            {(programs ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({programTypeLabel(p.program_type)})
              </option>
            ))}
          </select>
          <input
            name="cost_stamps"
            type="number"
            min={1}
            placeholder="Costo en sellos"
            className={input}
          />
          <input
            name="cost_points"
            type="number"
            min={1}
            placeholder="Costo en puntos"
            className={input}
          />
          <input
            name="terms"
            placeholder="Términos (opcional)"
            className={input + " sm:col-span-2"}
          />
          <SubmitButton
            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper sm:col-span-2">
            Crear recompensa
          </SubmitButton>
        </RememberForm>
      </section>

      <ul className="mb-8 space-y-2">
        {(rewards ?? []).map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
          >
            <div>
              <p className="font-medium">
                {r.name}
                {r.status !== "active" && (
                  <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-ink-soft">
                    {statusLabel(r.status)}
                  </span>
                )}
              </p>
              <p className="text-sm text-ink-soft">
                {programName.get(r.program_id) ?? "?"} ·{" "}
                {r.cost_stamps ? `${r.cost_stamps} sellos` : `${r.cost_points} puntos`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <form
                action={setRewardStatus.bind(
                  null,
                  slug,
                  r.id,
                  r.status === "active" ? "inactive" : "active",
                )}
              >
                <SubmitButton
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100">
                  {r.status === "active" ? "Desactivar" : "Activar"}
                </SubmitButton>
              </form>
              <form action={deleteReward.bind(null, slug, r.id)}>
                <SubmitButton
                  className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                  confirm="¿Eliminar definitivamente? No se puede deshacer.">
                  Eliminar
                </SubmitButton>
              </form>
            </div>
          </li>
        ))}
        {(rewards ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-ink-soft">
            Sin recompensas todavía.
          </li>
        )}
      </ul>

      <h2 className="mb-3 text-lg font-medium">Canjes recientes</h2>
      <ul className="space-y-2">
        {(redemptions ?? []).map((r) => {
          const rw = Array.isArray(r.rewards) ? r.rewards[0] : r.rewards;
          const cu = Array.isArray(r.customers) ? r.customers[0] : r.customers;
          return (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-2 text-sm"
            >
              <span>
                {rw?.name ?? "?"} — {displayName(`${cu?.first_name ?? ""} ${cu?.last_name ?? ""}`)}
              </span>
              <span className="text-ink-soft">
                {new Date(r.created_at).toLocaleString("es-CO")} · {statusLabel(r.status)}
              </span>
            </li>
          );
        })}
        {(redemptions ?? []).length === 0 && (
          <li className="text-sm text-ink-soft">Sin canjes todavía.</li>
        )}
      </ul>
      <p className="mt-4 text-xs text-ink-soft">{programType.size} programa(s) activo(s)</p>
    </div>
  );
}
