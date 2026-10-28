"use client";

import type { ReactNode } from "react";
import { IconLogout } from "@/app/t/[token]/_components/icons";
import { SubmitButton } from "@/app/_components/submit-button";

// Chrome del nivel SaaS (marca PineappleLoyalty) para todo el panel.
export function DashboardChrome({
  email,
  signOut,
  children,
}: {
  email?: string;
  signOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-pl-bg">
      <header className="flex items-center justify-between gap-3 border-b border-black/[0.04] bg-white px-4 py-2.5 sm:px-8">
        {/* Nivel SaaS: marca PineappleLoyalty — la marca del comercio va en
            dashboard/[org]/layout, donde sí hay organización seleccionada. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pineapple/logo.png"
          alt="PineappleLoyalty — Make every visit count."
          className="h-20 w-auto sm:h-16"
        />
        <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-4">
          <span className="hidden truncate text-ink-soft sm:inline">
            {email}
          </span>
          <form action={signOut} className="shrink-0">
            <SubmitButton
              pendingText={null}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent transition hover:bg-accent/20 disabled:opacity-60"
            >
              <IconLogout className="size-5" />
            </SubmitButton>
          </form>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}
