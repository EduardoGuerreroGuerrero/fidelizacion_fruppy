import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { TitleBar } from "../_components/chrome";
import { IconChevron } from "../_components/icons";
import { PROMOS, PROMO_CATEGORIES } from "../_components/promos";

export const instant = false;

export default async function Promociones({
  params,
  searchParams,
}: PageProps<"/t/[token]/promociones">) {
  const { token } = await params;
  const { c } = await searchParams;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  if (!card) {
    return (
      <p className="m-8 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
        Tarjeta no encontrada.
      </p>
    );
  }

  const active = c ?? "todas";
  const list =
    active === "todas" ? PROMOS : PROMOS.filter((p) => p.category === active);

  return (
    <>
      <TitleBar title="Promociones" href={base} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/banner-promos.jpg"
        alt="Disfruta nuestros sabores y promociones"
        className="mx-auto mt-2 w-[calc(100%-2.5rem)] rounded-3xl"
      />

      {/* Chips de filtro */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROMO_CATEGORIES.map(({ key, label }) => {
          const on = active === key;
          return (
            <Link
              key={key}
              href={key === "todas" ? `${base}/promociones` : `${base}/promociones?c=${key}`}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                on ? "bg-brand text-white shadow-sm" : "bg-neutral-100 text-ink-soft"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Tarjetas de promoción */}
      <div className="mt-4 space-y-4 pb-2">
        {list.map((p) => (
          <div
            key={p.title}
            className={`mx-5 flex overflow-hidden rounded-[26px] ${p.bg}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.title}
              className="w-[42%] shrink-0 object-cover"
            />
            <div className="relative flex-1 p-4">
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${p.badgeColor}`}
              >
                {p.badge}
              </span>
              <p className="mt-2 font-semibold leading-tight text-ink">
                {p.title}
              </p>
              <p className="mt-1 text-xs leading-snug text-ink-soft">
                {p.description}
              </p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-bold text-white">
                  {p.price}
                </span>
                {p.oldPrice ? (
                  <span className="text-xs text-ink-soft line-through">
                    {p.oldPrice}
                  </span>
                ) : null}
              </p>
              <IconChevron className="absolute bottom-3 right-3 size-5 text-ink-soft" />
            </div>
          </div>
        ))}
        {list.length === 0 ? (
          <p className="mx-5 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
            No hay promociones en esta categoría por ahora.
          </p>
        ) : null}
      </div>
    </>
  );
}
