"use client";

import { useMemo, useState } from "react";
import type { CardLocation } from "./data";
import { IconPin } from "./icons";
import { LocationRow } from "./location-row";

// "Sedes cercanas": la geolocalización se pide SOLO tras el clic del
// usuario y tras explicar la finalidad. La posición nunca sale del
// navegador — la distancia se calcula localmente y no se persiste.

type Loc = CardLocation & { _km?: number };

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (Math.PI / 180);
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

type State = "idle" | "asking" | "denied" | "unavailable" | "sorted";

// Renderiza las filas aquí mismo: un Server Component no puede pasar
// funciones (renderRow) a un Client Component — antes la página daba 500.
export function NearbySort({ locations }: { locations: CardLocation[] }) {
  const [state, setState] = useState<State>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const withDistance = useMemo<Loc[]>(() => {
    if (!coords) return locations.map((l) => ({ ...l }));
    return locations
      .map((l): Loc =>
        l.lat != null && l.lng != null
          ? { ...l, _km: km(coords, { lat: l.lat, lng: l.lng }) }
          : { ...l },
      )
      .sort((a, b) => (a._km ?? Infinity) - (b._km ?? Infinity));
  }, [locations, coords]);

  const anyCoords = locations.some((l) => l.lat != null && l.lng != null);
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  function ask() {
    setState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setState("sorted");
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <>
      {anyCoords && supported && state !== "sorted" ? (
        <div className="mx-5 mt-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-[13px] leading-snug text-ink">
            <strong className="font-semibold">Sedes cercanas.</strong> Usamos
            tu ubicación una sola vez, en tu dispositivo, para ordenar las
            sedes por distancia. No se guarda ni se comparte con el comercio.
          </p>
          <button
            type="button"
            onClick={ask}
            disabled={state === "asking"}
            className="mt-3 flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <IconPin className="size-4" />
            {state === "asking" ? "Obteniendo ubicación…" : "Ordenar por cercanía"}
          </button>
          {state === "denied" ? (
            <p className="mt-2 text-xs text-ink-soft">
              Permiso denegado. Puedes habilitarlo en la configuración del
              navegador; la lista sigue disponible sin ubicación.
            </p>
          ) : null}
          {state === "unavailable" ? (
            <p className="mt-2 text-xs text-ink-soft">
              No se pudo obtener tu ubicación. La lista sigue disponible sin
              ordenar.
            </p>
          ) : null}
        </div>
      ) : null}

      {state === "sorted" ? (
        <div className="mx-5 mt-3 flex items-center gap-2 text-sm font-medium text-brand">
          <IconPin className="size-5" />
          Ordenadas por cercanía — tu ubicación no se guardó
        </div>
      ) : null}

      <ul className="mt-4">
        {withDistance.map((l) => (
          <LocationRow key={l.id} location={l} distanceKm={l._km} />
        ))}
        {withDistance.length === 0 ? (
          <li className="mx-5 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-ink-soft">
            Este comercio aún no ha publicado sus sedes.
          </li>
        ) : null}
      </ul>
    </>
  );
}
