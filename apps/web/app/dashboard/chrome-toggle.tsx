"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import type { ReactNode } from "react";

const FRUPPY_SLUG = "fruppy-helados";

// El panel Fruppy Helados tiene chrome propio (sidebar+topbar+móvil); para esa
// org el header genérico del dashboard se omite. El resto conserva el actual.
export function DashboardChrome({
  email,
  signOut,
  children,
}: {
  email?: string;
  signOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const segments = useSelectedLayoutSegments();
  const fruppy = segments[0] === FRUPPY_SLUG;

  if (fruppy) {
    return <div className="min-h-screen bg-[#faf6f8]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa]">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-4 py-3 sm:px-6">
        {/* Nivel SaaS: la marca del comercio va en dashboard/[org]/layout,
            donde sí hay organización seleccionada. */}
        <span className="flex min-w-0 items-center gap-2.5 font-semibold text-ink">
          Fidelización
        </span>
        <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-4">
          <span className="hidden truncate text-ink-soft sm:inline">{email}</span>
          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              className="rounded-full bg-accent-soft px-4 py-1.5 font-medium text-accent transition hover:bg-accent/20"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}
