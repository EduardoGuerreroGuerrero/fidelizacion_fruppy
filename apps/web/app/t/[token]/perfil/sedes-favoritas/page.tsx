import { getCardAppData } from "../../_components/data";
import { TitleBar } from "../../_components/chrome";
import { FavoriteButton } from "../../_components/interactive";
import { IconStore } from "../../_components/icons";

export const instant = false;

export default async function SedesFavoritas({
  params,
}: PageProps<"/t/[token]/perfil/sedes-favoritas">) {
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

  return (
    <>
      <TitleBar title="Mis sedes favoritas" href={`${base}/perfil`} />

      <p className="mx-5 mt-2 text-sm text-ink-soft">
        Marca con un corazón las sedes que visitas más seguido.
      </p>

      <ul className="mt-4 space-y-3 px-5">
        {card.locations.map((l) => (
          <li
            key={l.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-neutral-100"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-pastel-sky">
              <IconStore className="size-6 text-[#4a9fd8]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">{l.name}</span>
              <span className="block truncate text-xs text-ink-soft">
                {l.address}
              </span>
            </span>
            <FavoriteButton storageKey={`fav-${token}-${l.id}`} />
          </li>
        ))}
        {card.locations.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
            Este comercio aún no ha publicado sus sedes.
          </li>
        ) : null}
      </ul>
    </>
  );
}
