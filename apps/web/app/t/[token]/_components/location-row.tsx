import type { CardLocation } from "./data";
import { LocationThumb } from "./brand";

// Fila de sede. Archivo propio y sin dependencias de servidor: lo importa un
// Client Component (nearby.tsx) y un import de ./cards arrastraría data.ts.
export function LocationRow({
  location,
  distanceKm,
}: {
  location: CardLocation;
  distanceKm?: number;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${location.name} ${location.address ?? ""}`,
  )}`;
  return (
    <li className="mx-5 mb-4 flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
      <LocationThumb className="size-24 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-semibold leading-tight text-ink">
          {location.name}
          {distanceKm != null ? (
            <span className="ml-1.5 align-middle text-xs font-medium text-brand">
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">
          {location.address}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs font-semibold text-brand"
        >
          Cómo llegar
        </a>
      </div>
    </li>
  );
}
