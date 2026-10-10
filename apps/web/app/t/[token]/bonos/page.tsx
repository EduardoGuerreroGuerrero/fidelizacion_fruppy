import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { TitleBar } from "../_components/chrome";
import { RedemptionRow, RewardCard } from "../_components/cards";

export const instant = false;

export default async function MisBonos({
  params,
  searchParams,
}: PageProps<"/t/[token]/bonos">) {
  const { token } = await params;
  const { tab } = await searchParams;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  if (!card) {
    return (
      <p className="m-8 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
        Tarjeta no encontrada.
      </p>
    );
  }

  const isStamps = card.program_type === "stamps";
  const current = isStamps ? card.current_stamps : card.current_points;
  const historial = tab === "historial";

  const tabClass = (on: boolean) =>
    `flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition ${
      on ? "bg-brand text-white shadow-sm" : "text-ink-soft"
    }`;

  return (
    <>
      <TitleBar title="Mis bonos" href={base} />

      {/* Tabs Disponibles / Historial */}
      <div className="mx-5 mt-2 flex rounded-full bg-neutral-100 p-1">
        <Link href={`${base}/bonos`} className={tabClass(!historial)}>
          Disponibles
        </Link>
        <Link
          href={`${base}/bonos?tab=historial`}
          className={tabClass(historial)}
        >
          Historial
        </Link>
      </div>

      {!historial ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/banner-bonos.jpg"
            alt="Acumula sellos y canjea deliciosas recompensas"
            className="mx-auto mt-4 w-[calc(100%-2.5rem)] rounded-3xl"
          />
          <div className="mt-5">
            {card.rewards.length > 0 ? (
              card.rewards.map((r, i) => (
                <RewardCard
                  key={r.id}
                  reward={r}
                  current={current}
                  index={i}
                  base={base}
                />
              ))
            ) : (
              <p className="mx-5 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
                Aún no hay recompensas configuradas en este programa.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="mt-5">
          {card.redemptions.length > 0 ? (
            <ul>
              {card.redemptions.map((r) => (
                <RedemptionRow
                  key={r.id}
                  reward={r.reward}
                  redeemedAt={r.redeemed_at}
                  location={r.location}
                />
              ))}
            </ul>
          ) : (
            <p className="mx-5 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
              Todavía no has canjeado recompensas.
            </p>
          )}
        </div>
      )}
    </>
  );
}
