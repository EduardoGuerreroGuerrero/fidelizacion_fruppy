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
export function FavoriteButton({
  storageKey,
  label = "Marcar como favorita",
}: {
  storageKey: string;
  label?: string;
}) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    // Preferencia por dispositivo: solo existe en el cliente → lectura en efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFav(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={fav}
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

// Las preferencias de notificación ya no son localStorage: viven en
// customer_consents y se gestionan en perfil/notificaciones (PushToggle +
// formularios clásicos contra las RPCs de consentimiento).
