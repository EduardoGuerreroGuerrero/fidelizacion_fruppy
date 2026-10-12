"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Píldoras de navegación del org — resalta la sección activa en teal.
// `secondary` son opciones de baja frecuencia (analítica, config, auditoría):
// se muestran como enlaces discretos fuera del menú principal.
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
  const hrefFor = (path: string) => `${base}${path ? `/${path}` : ""}`;
  const isOn = (path: string, href: string) =>
    path === "" ? pathname === base : pathname.startsWith(href);
  return (
    <>
      <nav className="mb-2 flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-neutral-100">
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
      </nav>
      {secondary.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-[13px]">
          <span className="font-medium text-ink-soft">Más:</span>
          {secondary.map(([path, label]) => {
            const href = hrefFor(path);
            const on = isOn(path, href);
            return (
              <Link
                key={path}
                href={href}
                className={
                  on
                    ? "font-semibold text-brand"
                    : "text-ink-soft transition hover:text-ink"
                }
              >
                {label}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mb-6" />
      )}
    </>
  );
}
