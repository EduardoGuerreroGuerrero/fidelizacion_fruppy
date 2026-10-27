"use client";

import { useId, useState } from "react";
import { DEFAULT_BRAND_COLOR } from "@/lib/brand";

// Selector de color desplegable (input nativo type="color") sincronizado con
// un campo de texto hex — el navegador abre su propio picker de color al
// hacer click en el cuadro, sin añadir ninguna librería nueva.
export function ColorPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue || DEFAULT_BRAND_COLOR);
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Elegir color de la tarjeta"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_BRAND_COLOR}
        onChange={(e) => setValue(e.target.value)}
        className="size-10 shrink-0 cursor-pointer rounded-md border border-neutral-300 bg-transparent p-0.5"
      />
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={DEFAULT_BRAND_COLOR}
        maxLength={7}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
