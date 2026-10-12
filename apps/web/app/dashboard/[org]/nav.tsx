"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Píldoras de navegación del org — resalta la sección activa en teal.
// `secondary` son opciones de baja frecuencia (analítica, config, auditoría):
// se ocultan tras el botón "Más" del menú principal y solo se despliegan
// al hacer clic (o cuando la página actual es una de ellas).
export function OrgNav({
  base,
  items,
  secondary = [],
}: {
  base: string;
  items: readonly (readonly [string, string])[];
  secondary?: readonly (readonly [string, string])[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hrefFor = (path: string) => `${base}${path ? `/${path}` : ""}`;
  const isOn = (path: string, href: string) =>
    path === "" ? pathname === base : pathname.startsWith(href);
  const secondaryActive = secondary.some(([path]) =>
    isOn(path, hrefFor(path)),
  );
  const showSecondary = open || secondaryActive;

  return (
    <div className="relative mb-6">
      <nav className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-neutral-100">
        {items.map(([path, label]) => {
          const href = hrefFor(path);
          const on = isOn(path, href);
          return (
            <Link
              key={path}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                on
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink-soft hover:bg-neutral-100 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
        {secondary.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={showSecondary}
            className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              secondaryActive
                ? "bg-brand-soft font-semibold text-brand-dark"
                : "text-ink-soft hover:bg-neutral-100 hover:text-ink"
            }`}
          >
            Más
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`size-3.5 transition-transform ${showSecondary ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </nav>
      {secondary.length > 0 && showSecondary && (
        <div className="absolute inset-x-0 top-full z-20 mt-1.5 flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-neutral-100">
          {secondary.map(([path, label]) => {
            const href = hrefFor(path);
            const on = isOn(path, href);
            return (
              <Link
                key={path}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  on
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink-soft hover:bg-neutral-100 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
