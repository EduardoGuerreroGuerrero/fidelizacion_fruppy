import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

// Definiciones documentadas en docs/ANALYTICS.md — no mostrar ventas/LTV
// hasta que existan datos de compra fiables (criterio del plan).

type Daily = { day: string; count: number };
type Analytics = {
  timezone: string;
  days: number;
  granularity: "day" | "week" | "month";
  customers_total: number;
  customers_new: number;
  customers_active: number;
  visits_total: number;
  visits_daily: Daily[];
  points_earned: number;
  points_redeemed: number;
  stamps_earned: number;
  stamps_redeemed: number;
  rewards_issued: number;
  redemptions_completed: number;
  redemptions_reversed: number;
  return_rate: number | null;
  return_rate_numerator: number;
  return_rate_denominator: number;
};

const PERIODS = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 365, label: "1 año" },
] as const;

const GRANULARITIES = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
] as const;

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function bucketLabel(day: string, gran: string) {
  const d = new Date(day + "T00:00:00");
  if (gran === "month") return d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ days?: string; gran?: string }>;
}) {
  const { org: slug } = await params;
  const { days: daysParam, gran: granParam } = await searchParams;
  const days = PERIODS.some((p) => String(p.days) === daysParam) ? Number(daysParam) : 30;
  const granularity = GRANULARITIES.some((g) => g.value === granParam) ? granParam! : "day";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, timezone")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const { data: a } = await supabase.rpc("org_analytics", {
    p_org: org.id,
    p_days: days,
    p_granularity: granularity,
  });
  const m = a as unknown as Analytics | null;
  if (!m) notFound();

  const maxVisits = Math.max(1, ...m.visits_daily.map((d) => d.count));
  const totalVisits = m.visits_daily.reduce((s, d) => s + d.count, 0);
  const avgVisits = m.visits_daily.length
    ? (totalVisits / m.visits_daily.length).toFixed(1)
    : "0";
  // Con muchas barras (365 días en granularidad diaria) solo se rotulan
  // algunas para que el eje siga siendo legible.
  const labelEvery = Math.max(1, Math.ceil(m.visits_daily.length / 10));

  const filterLink = (d: number, g: string) => `?days=${d}&gran=${g}`;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-semibold">Analítica</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Cifras calculadas en la zona horaria {m.timezone.replace("_", " ")}.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Clientes activos" value={String(m.customers_total)} />
        <Card label="Clientes nuevos (período)" value={String(m.customers_new)} />
        <Card
          label="Clientes con actividad (período)"
          value={String(m.customers_active)}
          hint="≥1 visita o movimiento de saldo"
        />
        <Card label="Visitas (período)" value={String(m.visits_total)} />
        <Card
          label="Sellos otorgados"
          value={String(m.stamps_earned)}
          hint={`${m.stamps_redeemed} canjeados`}
        />
        <Card
          label="Puntos otorgados"
          value={String(m.points_earned)}
          hint={`${m.points_redeemed} canjeados`}
        />
        <Card
          label="Canjes completados"
          value={String(m.redemptions_completed)}
          hint={`${m.redemptions_reversed} revertidos`}
        />
        <Card
          label="Tasa de retorno"
          value={m.return_rate === null ? "—" : `${(m.return_rate * 100).toFixed(1)}%`}
          hint={`${m.return_rate_numerator} de ${m.return_rate_denominator} clientes volvieron ≥2 veces`}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Visitas por período</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
            {PERIODS.map((p) => (
              <a
                key={p.days}
                href={filterLink(p.days, granularity)}
                className={`px-3 py-1.5 font-medium transition ${
                  p.days === days
                    ? "bg-brand-dark text-white"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
            {GRANULARITIES.map((g) => (
              <a
                key={g.value}
                href={filterLink(days, g.value)}
                className={`px-3 py-1.5 font-medium transition ${
                  g.value === granularity
                    ? "bg-brand-dark text-white"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {g.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between text-xs text-ink-soft">
          <span>
            Total del período: <strong className="text-neutral-700 dark:text-neutral-300">{totalVisits}</strong>
          </span>
          <span>
            Promedio por {granularity === "month" ? "mes" : granularity === "week" ? "semana" : "día"}:{" "}
            <strong className="text-neutral-700 dark:text-neutral-300">{avgVisits}</strong>
          </span>
        </div>
        {m.visits_daily.length > 0 && totalVisits > 0 ? (
          <>
            <div className="flex h-44 items-end gap-[3px]">
              {m.visits_daily.map((d) => (
                <div
                  key={d.day}
                  title={`${bucketLabel(d.day, granularity)}: ${d.count} visitas`}
                  className="group relative flex-1 rounded-t bg-brand transition hover:bg-brand-dark"
                  style={{ height: `${Math.max(2, (d.count / maxVisits) * 100)}%` }}
                >
                  {d.count > 0 && (
                    <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 text-[11px] font-semibold text-neutral-600 group-hover:block dark:text-neutral-300">
                      {d.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-[3px] text-[11px] text-ink-soft">
              {m.visits_daily.map((d, i) => {
                const last = i === m.visits_daily.length - 1;
                // Escritorio: una fecha cada `labelEvery` barras. Móvil: solo
                // caben tres (inicio, mitad y final).
                const mid = Math.round((m.visits_daily.length - 1) / 2);
                const onDesktop = i % labelEvery === 0 || last;
                const onMobile = i === 0 || last || i === mid;
                const show = onDesktop || onMobile;
                const visibility = onDesktop && onMobile ? "" : onDesktop ? "max-sm:hidden " : "sm:hidden ";
                return (
                  <span key={d.day} className="relative h-4 min-w-0 flex-1">
                    {show && (
                      <span
                        className={`absolute top-0 whitespace-nowrap ${visibility}${
                          i === 0 ? "left-0" : last ? "right-0" : "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        {bucketLabel(d.day, granularity)}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-sm text-ink-soft">
            Sin visitas registradas en este período.
          </p>
        )}
      </div>
    </div>
  );
}
