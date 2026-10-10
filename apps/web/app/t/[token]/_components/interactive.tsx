"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconHeart } from "./icons";

// Botón copiar al portapapeles con confirmación visual.
export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1600);
        } catch {
          /* portapapeles no disponible */
        }
      }}
      className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition ${
        ok ? "bg-brand-dark" : "bg-brand"
      }`}
    >
      {ok ? <IconCheck className="size-4" /> : null}
      {ok ? "¡Copiado!" : "Copiar código"}
    </button>
  );
}

// Corazón de sede favorita — persiste en localStorage del dispositivo.
export function FavoriteButton({ storageKey }: { storageKey: string }) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    // Preferencia por dispositivo: solo existe en el cliente → lectura en efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFav(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);
  return (
    <button
      type="button"
      aria-label="Marcar como favorita"
      onClick={() => {
        const next = !fav;
        setFav(next);
        localStorage.setItem(storageKey, next ? "1" : "0");
      }}
      className={`rounded-full p-2 transition ${
        fav ? "text-accent" : "text-neutral-300"
      }`}
    >
      <IconHeart
        className="size-6"
        fill={fav ? "currentColor" : "none"}
      />
    </button>
  );
}

// Interruptor de preferencias de notificación — localStorage por dispositivo.
export function PrefToggle({
  storageKey,
  title,
  subtitle,
  defaultOn = true,
}: {
  storageKey: string;
  title: string;
  subtitle: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  useEffect(() => {
    const v = localStorage.getItem(storageKey);
    // Preferencia por dispositivo: solo existe en el cliente → lectura en efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v !== null) setOn(v === "1");
  }, [storageKey]);
  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">{title}</span>
        <span className="block text-xs text-ink-soft">{subtitle}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => {
          const next = !on;
          setOn(next);
          localStorage.setItem(storageKey, next ? "1" : "0");
        }}
        className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${
          on ? "bg-brand" : "bg-neutral-200"
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-white shadow transition ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </li>
  );
}
