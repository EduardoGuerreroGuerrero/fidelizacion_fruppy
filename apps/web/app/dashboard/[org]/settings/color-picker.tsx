"use client";

import { useId, useState } from "react";

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
  const [value, setValue] = useState(defaultValue || "#16a34a");
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Elegir color de la tarjeta"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#16a34a"}
        onChange={(e) => setValue(e.target.value)}
        className="size-10 shrink-0 cursor-pointer rounded-md border border-neutral-300 bg-transparent p-0.5 dark:border-neutral-700"
      />
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="#16a34a"
        maxLength={7}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
      />
    </div>
  );
}
