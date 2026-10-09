import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

// Definiciones documentadas en docs/ANALYTICS.md — no mostrar ventas/LTV
// hasta que existan datos de compra fiables (criterio del plan).

type Daily = { day: string; count: number };
type Analytics = {
  timezone: string;
  days: number;
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

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-neutral-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

export default async function AnalyticsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
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

  const days = 30;
  const { data: a } = await supabase.rpc("org_analytics", {
    p_org: org.id,
    p_days: days,
  });
  const m = a as unknown as Analytics | null;
  if (!m) notFound();

  const maxVisits = Math.max(1, ...m.visits_daily.map((d) => d.count));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-semibold">Analítica</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Últimos {m.days} días · zona horaria {m.timezone} · definiciones en{" "}
        <code>docs/ANALYTICS.md</code>
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

      <h2 className="mb-3 text-lg font-medium">Visitas por día</h2>
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex h-36 items-end gap-[3px]">
          {m.visits_daily.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.count} visitas`}
              className="flex-1 rounded-t bg-green-500/80"
              style={{ height: `${(d.count / maxVisits) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-neutral-400">
          <span>{m.visits_daily[0]?.day}</span>
          <span>{m.visits_daily[m.visits_daily.length - 1]?.day}</span>
        </div>
      </div>
    </div>
  );
}
