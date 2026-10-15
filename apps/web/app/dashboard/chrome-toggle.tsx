"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import type { ReactNode } from "react";
import { IconLogout } from "@/app/t/[token]/_components/icons";

const FRUPPY_SLUG = "fruppy-helados";

// El panel Fruppy Helados tiene chrome propio (sidebar+topbar+móvil); para esa
// org el header genérico del dashboard se omite. El resto usa el chrome
// PineappleLoyalty del nivel SaaS.
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
    <div className="flex min-h-screen flex-col bg-pl-bg">
      <header className="flex items-center justify-between gap-3 border-b border-black/[0.04] bg-white px-4 py-2.5 sm:px-8">
        {/* Nivel SaaS: marca PineappleLoyalty — la marca del comercio va en
            dashboard/[org]/layout, donde sí hay organización seleccionada. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pineapple/logo.png"
          alt="PineappleLoyalty"
          className="h-14 w-auto sm:h-12"
        />
        <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-4">
          <span className="hidden truncate text-ink-soft sm:inline">
            {email}
          </span>
          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent transition hover:bg-accent/20"
            >
              <IconLogout className="size-5" />
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}
