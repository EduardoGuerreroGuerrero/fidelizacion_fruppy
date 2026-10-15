"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  IconAward,
  IconBell,
  IconChartBar,
  IconChevronDown,
  IconDoc,
  IconGear,
  IconGift,
  IconGrid,
  IconHome,
  IconLogout,
  IconMenu,
  IconPin,
  IconScan,
  IconUserPlus,
  IconUsers,
} from "@/app/t/[token]/_components/icons";
import { initials } from "./config";

// Icono por segmento de ruta del panel.
const PATH_ICON: Record<string, (p: { className?: string }) => ReactNode> = {
  "": (p) => <IconHome {...p} />,
  scan: (p) => <IconScan {...p} />,
  customers: (p) => <IconUsers {...p} />,
  programs: (p) => <IconGift {...p} />,
  rewards: (p) => <IconAward {...p} />,
  analytics: (p) => <IconChartBar {...p} />,
  team: (p) => <IconUserPlus {...p} />,
  locations: (p) => <IconPin {...p} />,
  audit: (p) => <IconDoc {...p} />,
  settings: (p) => <IconGear {...p} />,
};

const pill =
  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition";

type NavItem = readonly [string, string];

export function FruppyShell({
  base,
  orgName,
  userName,
  roleLabel,
  nav,
  secondary,
  signOut,
  children,
}: {
  base: string;
  orgName: string;
  userName: string;
  roleLabel: string;
  nav: readonly NavItem[];
  secondary: readonly NavItem[];
  signOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [progOpen, setProgOpen] = useState(true);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const hrefFor = (path: string) => `${base}${path ? `/${path}` : ""}`;
  const isOn = (path: string) =>
    path === "" ? pathname === base : pathname.startsWith(hrefFor(path));

  const programsItem = nav.find(([p]) => p === "programs");
  const secondaryActive = secondary.some(([p]) => isOn(p));
  const progOpenNow = progOpen || secondaryActive || isOn("programs");
  const userInitials = initials(userName);

  return (
    <div className="min-h-screen bg-[#faf6f8] lg:flex">
      {/* ============ SIDEBAR (lg+) ============ */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-black/[0.04] bg-white px-4 py-5 transition-[width] lg:flex ${
          sideCollapsed ? "w-[76px] items-center px-2" : "w-64"
        }`}
      >
        <Link href={base} className="mb-6 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sideCollapsed ? "/brand/logo-sm.png" : "/brand/logo.png"}
            alt={orgName}
            className={`object-contain ${sideCollapsed ? "h-12" : "h-20"}`}
          />
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(([path, label]) => {
            if (path === "programs") {
              // Grupo "Programa" con sub-items (como el mockup web).
              const active = isOn("programs") || secondaryActive;
              return (
                <div key={path}>
                  <button
                    type="button"
                    onClick={() => setProgOpen((v) => !v)}
                    aria-expanded={progOpenNow}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${
                      active ? "bg-pastel-mint font-semibold text-brand-dark" : "text-navy hover:bg-neutral-50"
                    } ${sideCollapsed ? "justify-center px-0" : ""}`}
                  >
                    <IconGift className="size-5 shrink-0" />
                    {!sideCollapsed && (
                      <>
                        <span className="flex-1 text-left">{label}</span>
                        <IconChevronDown
                          className={`size-4 transition-transform ${progOpenNow ? "" : "-rotate-90"}`}
                        />
                      </>
                    )}
                  </button>
                  {!sideCollapsed && progOpenNow && (
                    <div className="ml-6 mt-1 flex flex-col gap-0.5 border-l-2 border-pastel-mint pl-3">
                      {[["programs", "Programas"] as const, ...secondary].map(([sp, sl]) => (
                        <Link
                          key={sp}
                          href={hrefFor(sp)}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition ${
                            isOn(sp)
                              ? "font-semibold text-brand-dark"
                              : "text-ink-soft hover:text-navy"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isOn(sp) ? "bg-brand" : "bg-neutral-300"
                            }`}
                          />
                          {sl}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            const Icon = PATH_ICON[path] ?? (() => null);
            const on = isOn(path);
            return (
              <Link
                key={path}
                href={hrefFor(path)}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${
                  on ? "bg-pastel-mint font-semibold text-brand-dark" : "text-navy hover:bg-neutral-50"
                } ${sideCollapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="size-5 shrink-0" />
                {!sideCollapsed && label}
              </Link>
            );
          })}

          {/* Grupo "Más" */}
          {!sideCollapsed && (
            <div>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-navy transition hover:bg-neutral-50"
              >
                <IconGrid className="size-5 shrink-0" />
                <span className="flex-1 text-left">Más</span>
                <IconChevronDown
                  className={`size-4 transition-transform ${moreOpen ? "" : "-rotate-90"}`}
                />
              </button>
              {moreOpen && (
                <div className="ml-6 mt-1 flex flex-col gap-0.5 border-l-2 border-pastel-mint pl-3">
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-2.5 py-1.5 text-[13px] text-ink-soft transition hover:text-navy"
                  >
                    Cambiar de organización
                  </Link>
                  <Link
                    href="/dashboard/new"
                    className="rounded-lg px-2.5 py-1.5 text-[13px] text-ink-soft transition hover:text-navy"
                  >
                    Nueva organización
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Tarjeta promo del sidebar */}
        {!sideCollapsed && (
          <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-pastel-pink to-[#f6bcd4] p-4">
            <p className="font-script text-xl leading-tight text-wine">
              Más momentos dulces juntos
            </p>
            <p className="mt-0.5 text-[11px] text-navy/60">
              Gracias por ser parte de {orgName}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Link
                href={programsItem ? hrefFor(programsItem[0]) : base}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-accent shadow-sm transition hover:shadow"
              >
                Conoce más →
              </Link>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/promo-1.jpg"
                alt=""
                className="h-14 w-14 rounded-2xl object-cover"
              />
            </div>
          </div>
        )}
      </aside>

      {/* ============ COLUMNA PRINCIPAL ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header móvil */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/[0.04] bg-white px-4 py-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-sm.png" alt="" className="h-9 w-auto shrink-0" />
            <span className="truncate font-semibold text-navy">{orgName}</span>
          </div>
          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/20"
            >
              <IconLogout className="size-4" />
              Salir
            </button>
          </form>
        </header>

        {/* Nav móvil: píldoras en dos filas */}
        <div className="sticky top-[60px] z-20 border-b border-black/[0.04] bg-[#faf6f8]/95 px-4 py-2 backdrop-blur lg:hidden">
          <nav className="flex flex-wrap items-center gap-1.5">
            {nav
              .filter(([p]) => p !== "programs")
              .map(([path, label]) => {
                const Icon = PATH_ICON[path] ?? (() => null);
                const on = isOn(path);
                return (
                  <Link
                    key={path}
                    href={hrefFor(path)}
                    className={`${pill} ${
                      on
                        ? "bg-brand text-white shadow-sm"
                        : "bg-white text-ink-soft hover:text-ink"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            {programsItem && (
              <Link
                href={hrefFor("programs")}
                className={`${pill} ${
                  isOn("programs")
                    ? "bg-brand text-white shadow-sm"
                    : "bg-white text-ink-soft hover:text-ink"
                }`}
              >
                <IconGift className="size-4" />
                {programsItem[1]}
              </Link>
            )}
            {secondary.length > 0 && (
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen || secondaryActive}
                className={`${pill} ${
                  secondaryActive
                    ? "bg-pastel-mint font-semibold text-brand-dark"
                    : "bg-white text-ink-soft hover:text-ink"
                }`}
              >
                Más
                <IconChevronDown
                  className={`size-3.5 transition-transform ${
                    moreOpen || secondaryActive ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </nav>
          {secondary.length > 0 && (moreOpen || secondaryActive) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {secondary.map(([path, label]) => {
                const Icon = PATH_ICON[path] ?? (() => null);
                const on = isOn(path);
                return (
                  <Link
                    key={path}
                    href={hrefFor(path)}
                    onClick={() => setMoreOpen(false)}
                    className={`${pill} ${
                      on
                        ? "bg-brand text-white shadow-sm"
                        : "bg-white text-ink-soft hover:text-ink"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Topbar desktop */}
        <div className="sticky top-0 z-20 hidden bg-[#faf6f8]/95 px-6 pt-4 backdrop-blur lg:block">
          <div className="flex items-center justify-between gap-4 rounded-3xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.04]">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSideCollapsed((v) => !v)}
                aria-label="Contraer menú"
                className="flex size-10 items-center justify-center rounded-2xl text-navy transition hover:bg-neutral-100"
              >
                <IconMenu className="size-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-sm.png" alt="" className="h-9 w-auto" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold text-navy">{orgName}</p>
                <p className="text-xs text-ink-soft">Panel de fidelización</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notificaciones"
                  aria-expanded={bellOpen}
                  onClick={() => {
                    setBellOpen((v) => !v);
                    setUserOpen(false);
                  }}
                  className="flex size-10 items-center justify-center rounded-full ring-1 ring-neutral-200 transition hover:bg-neutral-50"
                >
                  <IconBell className="size-5 text-navy" />
                </button>
                {bellOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar"
                      onClick={() => setBellOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/[0.06]">
                      <p className="text-sm font-semibold text-navy">
                        Notificaciones
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Sin notificaciones nuevas.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                  onClick={() => {
                    setUserOpen((v) => !v);
                    setBellOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 ring-1 ring-neutral-200 transition hover:bg-neutral-50"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-pastel-lav text-xs font-bold text-[#7c5cd6]">
                    {userInitials || "?"}
                  </span>
                  <span className="leading-tight">
                    <span className="block max-w-[160px] truncate text-left text-sm font-semibold text-navy">
                      {userName}
                    </span>
                    <span className="block text-[11px] text-ink-soft">
                      {roleLabel}
                    </span>
                  </span>
                  <IconChevronDown
                    className={`size-4 text-ink-soft transition-transform ${userOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {userOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar"
                      onClick={() => setUserOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-2 w-56 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/[0.06]"
                    >
                      <Link
                        href="/dashboard"
                        onClick={() => setUserOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-navy transition hover:bg-neutral-50"
                      >
                        Cambiar de organización
                      </Link>
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
                        >
                          <IconLogout className="size-4" />
                          Cerrar sesión
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
