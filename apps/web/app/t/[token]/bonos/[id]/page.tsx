import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardAppData } from "../../_components/data";
import { TitleBar } from "../../_components/chrome";
import { StampMini } from "../../_components/stamps";
import { IconQr } from "../../_components/icons";

export const instant = false;

const STYLES = [
  { bg: "bg-pastel-pink", btn: "bg-accent" },
  { bg: "bg-pastel-mint", btn: "bg-brand" },
  { bg: "bg-pastel-cream", btn: "bg-[#f0a040]" },
  { bg: "bg-pastel-lav", btn: "bg-[#9b6ddf]" },
  { bg: "bg-pastel-sky", btn: "bg-[#4a9fd8]" },
] as const;

export default async function BonoDetalle({
  params,
}: PageProps<"/t/[token]/bonos/[id]">) {
  const { token, id } = await params;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);
  const reward = card?.rewards.find((r) => r.id === id);
  if (!card || !reward) notFound();

  const index = Math.max(
    card.rewards.findIndex((r) => r.id === id),
    0,
  );
  const style = STYLES[index % STYLES.length];
  const n = (index % 5) + 1;
  const isStamps = reward.cost_stamps != null;
  const goal = reward.cost_stamps ?? reward.cost_points ?? 0;
  const current = isStamps ? card.current_stamps : card.current_points;
  const missing = Math.max(goal - current, 0);
  const unit = isStamps ? "sello" : "punto";

  return (
    <>
      <TitleBar title="Detalle del bono" href={`${base}/bonos`} />

      <div className={`relative mx-5 mt-2 overflow-hidden rounded-[28px] ${style.bg} p-6`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/brand/bono-photo-${n}.jpg`}
          alt=""
          className="absolute -top-5 right-0 h-24 w-28 object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/brand/bono-icon-${n}.jpg`}
          alt=""
          className="size-24 rounded-full object-cover shadow-md"
        />
        <h2 className="mt-4 text-xl font-semibold text-ink">{reward.name}</h2>
        {reward.description ? (
          <p className="mt-1 text-sm leading-snug text-ink-soft">
            {reward.description}
          </p>
        ) : null}
        <p className="mt-3 text-sm font-medium text-ink">
          {missing > 0
            ? `Completa ${missing} ${unit}${missing === 1 ? "" : "s"} más para canjearla`
            : "¡Ya puedes canjearla!"}
        </p>
        <div className="mt-3">
          {isStamps ? (
            <StampMini current={current} goal={goal} />
          ) : (
            <span className="text-sm font-semibold text-ink">
              {Math.min(current, goal)} / {goal} puntos
            </span>
          )}
        </div>
      </div>

      {reward.terms ? (
        <div className="mx-5 mt-5 rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Términos
          </p>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            {reward.terms}
          </p>
        </div>
      ) : null}

      <div className="mx-5 mt-6">
        <Link
          href={`${base}/escanear`}
          className={`flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white shadow-sm ${style.btn}`}
        >
          <IconQr className="size-5" />
          Mostrar QR para canjear
        </Link>
        <p className="mt-3 text-center text-xs text-ink-soft">
          El equipo en caja valida tu saldo y registra el canje.
        </p>
      </div>
    </>
  );
}
