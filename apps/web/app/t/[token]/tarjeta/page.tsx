import { RewardThumb, isFruppy } from "../_components/brand";
import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { Section, TitleBar } from "../_components/chrome";
import { LoyaltyCard } from "../_components/loyalty-card";
import { StampRow } from "../_components/stamps";
import { NextRewardCard } from "../_components/cards";
import { walletProvider } from "@/lib/wallet/passlet";

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
  const googleOn = walletProvider.googleEnabled();
  const appleOn = walletProvider.appleEnabled();

  return (
    <>
      <TitleBar title="Mi tarjeta" href={base} />

      <div className="mt-2">
        <LoyaltyCard
          brand={card}
          active={card.card_status === "active"}
          firstName={card.first_name}
          current={current}
          goal={isStamps ? goal : null}
          programType={card.program_type}
          qrHref={`${base}/escanear`}
          qrLabel="Mostrar QR"
        />
      </div>

      {/* Guardar en wallet nativo — solo si el proveedor está configurado
          y el comercio tiene la función activa (features.wallet, default on) */}
      {(googleOn || appleOn) && card.card_status === "active" && card.wallet_enabled !== false ? (
        <div className="mx-5 mt-4 flex gap-3">
          {googleOn ? (
            <a
              href={`${base}/wallet/google`}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
            >
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1a6 6 0 0 1-5.7-4.1H2.9v2.7A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.3 13.9a6 6 0 0 1 0-3.8V7.4H2.9a10 10 0 0 0 0 9.2l3.4-2.7Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 2.9 7.4l3.4 2.7A6 6 0 0 1 12 6Z"
                />
              </svg>
              Google Wallet
            </a>
          ) : null}
          {appleOn ? (
            <a
              href={`${base}/wallet/apple`}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
            >
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
                <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.28-1.02-3.75-1-1.93.03-3.71 1.12-4.7 2.85-2.01 3.48-.51 8.64 1.44 11.47.96 1.39 2.1 2.94 3.6 2.88 1.44-.06 1.99-.93 3.73-.93s2.23.93 3.76.9c1.55-.03 2.54-1.41 3.49-2.8 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.03-1.16-3.07-4.56ZM14.16 4.06c.79-.96 1.32-2.29 1.18-3.62-1.14.05-2.52.76-3.34 1.72-.73.85-1.38 2.21-1.2 3.51 1.27.1 2.57-.65 3.36-1.61Z" />
              </svg>
              Apple Wallet
            </a>
          ) : null}
        </div>
      ) : null}

      {isStamps ? (
        <>
          <Section
            title="Progreso de tus sellos"
            actionText={`${Math.min(current, goal!)} de ${goal}`}
          />
          <StampRow current={current} goal={goal!} icon={card.stamp_icon} />
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
                  <RewardThumb fruppy={isFruppy(card)} n={(i % 5) + 1} className="size-10 shrink-0 rounded-full" />
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

    </>
  );
}
