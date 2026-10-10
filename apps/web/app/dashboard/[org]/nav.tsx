"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Píldoras de navegación del org — resalta la sección activa en teal.
export function OrgNav({
  base,
  items,
}: {
  base: string;
  items: readonly (readonly [string, string])[];
}) {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-neutral-100">
      {items.map(([path, label]) => {
        const href = `${base}${path ? `/${path}` : ""}`;
        const on = path === "" ? pathname === base : pathname.startsWith(href);
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
  );
}
