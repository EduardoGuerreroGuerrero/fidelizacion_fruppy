"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Item = readonly [path: string, label: string];
export type NavGroup = { label: string; items: readonly Item[] };

// Píldoras de navegación del org — resalta la sección activa.
// `items` son las tareas frecuentes (enlaces directos). `groups` agrupa el
// resto por tema en menús desplegables; un grupo con un solo ítem se muestra
// como enlace directo. El panel se cierra con clic fuera, Esc o al navegar.
export function OrgNav({
  base,
  items,
  groups = [],
}: {
  base: string;
  items: readonly Item[];
  groups?: readonly NavGroup[];
}) {
  const pathname = usePathname();
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hrefFor = (path: string) => `${base}${path ? `/${path}` : ""}`;
  const isOn = (path: string) =>
    path === "" ? pathname === base : pathname.startsWith(hrefFor(path));

  useEffect(() => {
    if (!openLabel) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenLabel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenLabel(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openLabel]);

  const pill = (on: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      on
        ? "bg-brand-dark text-white shadow-sm"
        : "text-ink-soft hover:bg-neutral-100 hover:text-ink"
    }`;

  const link = ([path, label]: Item, onClick?: () => void) => (
    <Link
      key={path}
      href={hrefFor(path)}
      onClick={onClick}
      aria-current={isOn(path) ? "page" : undefined}
      className={pill(isOn(path))}
    >
      {label}
    </Link>
  );

  const openGroup = groups.find((g) => g.label === openLabel);

  return (
    <div ref={wrapRef} className="relative mb-6">
      <nav className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-neutral-100">
        {items.map((it) => link(it, () => setOpenLabel(null)))}
        {groups.map((g) => {
          if (g.items.length === 1) return link(g.items[0], () => setOpenLabel(null));
          const active = g.items.some(([p]) => isOn(p));
          const open = openLabel === g.label;
          return (
            <button
              key={g.label}
              type="button"
              onClick={() => setOpenLabel(open ? null : g.label)}
              aria-expanded={open}
              aria-haspopup="true"
              className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-soft font-semibold text-brand-dark"
                  : "text-ink-soft hover:bg-neutral-100 hover:text-ink"
              }`}
            >
              {g.label}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          );
        })}
      </nav>
      {openGroup && (
        <div className="absolute inset-x-0 top-full z-20 mt-1.5 flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-neutral-100">
          {openGroup.items.map((it) => link(it, () => setOpenLabel(null)))}
        </div>
      )}
    </div>
  );
}
