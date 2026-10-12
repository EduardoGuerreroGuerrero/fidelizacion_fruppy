import Link from "next/link";
import { getCardAppData } from "./_components/data";
import { HomeHeader, Section } from "./_components/chrome";
import { LoyaltyCard } from "./_components/loyalty-card";
import { StampRow } from "./_components/stamps";
import { NextRewardCard } from "./_components/cards";
import { IconQr } from "./_components/icons";

export const instant = false;

export default async function CardHome({
  params,
}: PageProps<"/t/[token]">) {
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
  const revoked = card.card_status !== "active";

  // Siguiente recompensa: la de menor costo que aún no alcanza; si ya alcanza
  // todas, la primera de la lista.
  const cost = (r: (typeof card.rewards)[number]) =>
    isStamps ? (r.cost_stamps ?? Infinity) : (r.cost_points ?? Infinity);
  const next =
    card.rewards.find((r) => cost(r) > current) ?? card.rewards[0] ?? null;

  return (
    <>
      <HomeHeader firstName={card.first_name} orgName={card.org_name} />

      <div className="mt-5">
        <LoyaltyCard
          firstName={card.first_name}
          current={current}
          goal={isStamps ? goal : null}
          programType={card.program_type}
          cardHref={`${base}/tarjeta`}
          qrHref={`${base}/escanear`}
        />
      </div>

      {revoked ? (
        <p className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Tarjeta revocada — solicita una nueva en el comercio.
        </p>
      ) : null}

      {isStamps ? (
        <>
          <Section title="Tu progreso" />
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

      {/* Acción principal: presentar el QR en caja */}
      {!revoked ? (
        <Link
          href={`${base}/escanear`}
          className="mx-5 mt-6 flex items-center justify-center gap-2.5 rounded-2xl bg-brand py-4 text-[15px] font-semibold text-white shadow-md shadow-brand/25"
        >
          <IconQr className="size-6" />
          Mostrar mi QR
        </Link>
      ) : null}

      {card.rewards.length > 0 ? (
        <Link
          href={`${base}/bonos`}
          className="mx-5 mt-3 block text-center text-sm font-medium text-brand"
        >
          Ver todas mis recompensas
        </Link>
      ) : null}

      <p className="mt-8 pb-2 text-center text-[11px] text-neutral-300">
        Powered by Fruppy — tarjeta digital de fidelización
      </p>
    </>
  );
}
