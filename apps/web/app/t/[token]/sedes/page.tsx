import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { TitleBar } from "../_components/chrome";
import { LocationRow } from "../_components/cards";
import { IconPin } from "../_components/icons";

export const instant = false;

export default async function NuestrasSedes({
  params,
  searchParams,
}: PageProps<"/t/[token]/sedes">) {
  const { token } = await params;
  const { q: qRaw } = await searchParams;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  if (!card) {
    return (
      <p className="m-8 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
        Tarjeta no encontrada.
      </p>
    );
  }

  const query = (q ?? "").trim().toLowerCase();
  const locations = query
    ? card.locations.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          (l.address ?? "").toLowerCase().includes(query),
      )
    : card.locations;

  return (
    <>
      <TitleBar title="Nuestras sedes" href={base} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/banner-sedes.jpg"
        alt="Encuentra la sede más cercana a ti"
        className="mx-auto mt-2 w-[calc(100%-2.5rem)] rounded-3xl"
      />

      {/* Buscador */}
      <form action={`${base}/sedes`} className="mx-5 mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por zona o dirección..."
          className="w-full rounded-full bg-neutral-100 px-5 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-brand/40"
        />
      </form>

      <div className="mx-5 mt-3 flex items-center gap-2 text-sm font-medium text-brand">
        <IconPin className="size-5" />
        Mi ubicación
      </div>

      {/* Mapa */}
      <div className="mx-5 mt-3 overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mapa-sedes.jpg" alt="Mapa de sedes" className="w-full" />
      </div>

      {/* Lista de sedes */}
      <ul className="mt-4">
        {locations.map((l, i) => (
          <LocationRow key={l.id} location={l} index={i} />
        ))}
        {locations.length === 0 ? (
          <li className="mx-5 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
            {query
              ? "No encontramos sedes con esa búsqueda."
              : "Este comercio aún no ha publicado sus sedes."}
          </li>
        ) : null}
      </ul>

      <p className="pb-2 text-center text-xs text-ink-soft">
        ¿No ves tu sede?{" "}
        <Link href={`${base}/perfil/contacto`} className="font-semibold text-brand">
          Contáctanos
        </Link>
      </p>
    </>
  );
}
