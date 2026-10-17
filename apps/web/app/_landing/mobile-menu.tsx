"use client";

import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconMenu } from "./icons";

type Item = { label: string; href: string };

export default function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition hover:bg-neutral-100"
      >
        <IconMenu className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-40"
            onClick={close}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-neutral-100 bg-white p-2 shadow-lg">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/preguntas"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
            >
              Preguntas frecuentes
            </Link>
            <Link
              href="/contacto"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
            >
              Contacto
            </Link>
            <div className="my-2 border-t border-neutral-100" />
            <Link
              href="/login"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-pl-green hover:bg-neutral-50"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              onClick={close}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-pl-green-2 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Probar gratis
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
