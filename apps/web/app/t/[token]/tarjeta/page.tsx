import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { Section, TitleBar } from "../_components/chrome";
import { LoyaltyCard } from "../_components/loyalty-card";
import { StampRow } from "../_components/stamps";
import { NextRewardCard } from "../_components/cards";

export const instant = false;

export default async function MiTarjeta({
  params,
}: PageProps<"/t/[token]/tarjeta">) {
  const { token } = await params;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  if (!card) {
    return (
      <p className="m-8 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
        Tarjeta no encontrada.
      </p>
    );
  }

  const isStamps = card.program_type === "stamps" && card.stamp_goal;
  const current = isStamps ? card.current_stamps : card.current_points;
  const goal = card.stamp_goal;
  const cost = (r: (typeof card.rewards)[number]) =>
    isStamps ? (r.cost_stamps ?? Infinity) : (r.cost_points ?? Infinity);
  const next =
    card.rewards.find((r) => cost(r) > current) ?? card.rewards[0] ?? null;

  return (
    <>
      <TitleBar title="Mi tarjeta" href={base} />

      <div className="mt-2">
        <LoyaltyCard
          firstName={card.first_name}
          current={current}
          goal={isStamps ? goal : null}
          programType={card.program_type}
          qrHref={`${base}/escanear`}
          qrLabel="Mostrar QR"
        />
      </div>

      {isStamps ? (
        <>
          <Section
            title="Progreso de tus sellos"
            actionText={`${Math.min(current, goal!)} de ${goal}`}
          />
          <StampRow current={current} goal={goal!} />
        </>
      ) : null}

      {next ? (
        <>
          <Section title="Siguiente recompensa" />
          <NextRewardCard
            reward={next}
            current={current}
            href={`${base}/bonos/${next.id}`}
          />
        </>
      ) : null}

      {card.rewards.length > 0 ? (
        <>
          <Section title="Mis recompensas" actionHref={`${base}/bonos`} />
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {card.rewards.slice(0, 6).map((r, i) => {
              const g = r.cost_stamps ?? r.cost_points ?? 0;
              const pct = g > 0 ? Math.min(100, Math.round((current / g) * 100)) : 0;
              return (
                <Link
                  key={r.id}
                  href={`${base}/bonos/${r.id}`}
                  className="flex w-40 shrink-0 items-center gap-2.5 rounded-2xl bg-neutral-50 p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/brand/bono-icon-${(i % 5) + 1}.jpg`}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium leading-tight text-ink">
                      {r.name}
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-neutral-200">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold text-ink-soft">
                      {Math.min(current, g)}/{g}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      ) : null}

      <Section title="Promociones para ti" actionHref={`${base}/promociones`} />
      <Link href={`${base}/promociones`} className="mx-5 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/promo-hero.jpg"
          alt="Promoción Fruppy"
          className="w-full rounded-3xl"
        />
      </Link>
    </>
  );
}
