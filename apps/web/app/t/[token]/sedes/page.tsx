import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { TitleBar } from "../_components/chrome";
import { LocationRow } from "../_components/location-row";
import { NearbySort } from "../_components/nearby";

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


      {/* Lista de sedes — orden por cercanía opcional (geolocalización
          en el dispositivo, sin persistir ni enviar la posición) */}
      {card.location_enabled ? (
        <NearbySort locations={locations} />
      ) : (
        <ul className="mt-4">
          {locations.map((l) => (
            <LocationRow key={l.id} location={l} />
          ))}
        </ul>
      )}
      {locations.length === 0 ? (
        <p className="mx-5 mt-4 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
          {query
            ? "No encontramos sedes con esa búsqueda."
            : "Este comercio aún no ha publicado sus sedes."}
        </p>
      ) : null}

      <p className="pb-2 text-center text-xs text-ink-soft">
        ¿No ves tu sede?{" "}
        <Link href={`${base}/perfil/contacto`} className="font-semibold text-brand">
          Contáctanos
        </Link>
      </p>
    </>
  );
}
