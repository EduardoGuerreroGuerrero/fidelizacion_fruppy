import Link from "next/link";
import { getCardAppData } from "./_components/data";
import { HomeHeader, Section } from "./_components/chrome";
import { LoyaltyCard } from "./_components/loyalty-card";
import { StampRow } from "./_components/stamps";
import { NextRewardCard } from "./_components/cards";
import { IconQr } from "./_components/icons";
import { walletProvider } from "@/lib/wallet/passlet";

export const instant = false;

export default async function CardHome({
  params,
  searchParams,
}: PageProps<"/t/[token]">) {
  const { token } = await params;
  const { bienvenida } = await searchParams;
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
  const consentPending = card.consent_pending === true;

  // Siguiente recompensa: la de menor costo que aún no alcanza; si ya alcanza
  // todas, la primera de la lista.
  const cost = (r: (typeof card.rewards)[number]) =>
    isStamps ? (r.cost_stamps ?? Infinity) : (r.cost_points ?? Infinity);
  const next =
    card.rewards.find((r) => cost(r) > current) ?? card.rewards[0] ?? null;
  const showWallet =
    !revoked &&
    card.wallet_enabled !== false &&
    (walletProvider.googleEnabled() || walletProvider.appleEnabled());

  return (
    <>
      <HomeHeader firstName={card.first_name} orgName={card.org_name} />

      {/* Llegada desde el autorregistro por QR: confirmación + aviso del
          correo de bienvenida con el enlace permanente a la tarjeta. */}
      {bienvenida === "1" ? (
        <p className="mx-5 mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          ¡Bienvenida/o a {card.org_name}! Tu tarjeta está lista y te enviamos
          el enlace a tu correo — guárdalo para volver cuando quieras.
        </p>
      ) : null}

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

      {/* Consentimiento — solo la primera vez; al aceptar desaparece. */}
      {consentPending ? (
        <form
          method="post"
          action={`${base}/consent`}
          className="mx-5 mt-4 rounded-2xl border border-brand/30 bg-brand/5 p-4"
        >
          <p className="text-sm font-semibold text-ink">Autorizaciones</p>
          <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-snug text-ink">
            <input
              type="checkbox"
              name="data_consent"
              required
              className="mt-0.5 size-4 shrink-0 accent-brand"
            />
            <span>
              Autorizo el tratamiento de mis datos personales conforme a la{" "}
              <Link href={`${base}/perfil/privacidad`} className="font-medium text-brand underline">
                política de privacidad
              </Link>
              . <span className="text-ink-soft">(obligatorio)</span>
            </span>
          </label>
          <label className="mt-2.5 flex items-start gap-2.5 text-[13px] leading-snug text-ink">
            <input
              type="checkbox"
              name="marketing_consent"
              className="mt-0.5 size-4 shrink-0 accent-brand"
            />
            <span>
              Acepto recibir publicidad y mensajes promocionales.{" "}
              <span className="text-ink-soft">(opcional)</span>
            </span>
          </label>
          <button
            type="submit"
            className="mt-3.5 w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white"
          >
            Confirmar
          </button>
        </form>
      ) : null}

      {isStamps ? (
        <>
          <Section title="Tu progreso" />
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

      {/* Guardar en wallet — visible en la home, no solo en /tarjeta */}
      {showWallet ? (
        <div className="mx-5 mt-4 flex gap-3">
          {walletProvider.googleEnabled() ? (
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
          {walletProvider.appleEnabled() ? (
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

      <p className="mt-8 flex items-center justify-center gap-1.5 pb-2 text-[11px] text-neutral-300">
        Powered by
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pineapple/isotipo.png" alt="" className="h-3.5 w-auto" />
        PineappleLoyalty — tarjeta digital de fidelización
      </p>
    </>
  );
}
