"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCard, IconQr } from "./icons";

// Barra inferior mínima: Mi tarjeta (saldo/progreso) y Mi QR (código para
// mostrar en caja). Las demás rutas siguen existiendo vía enlaces internos,
// pero no compiten por la atención en la navegación principal.
export function TabBar({ base }: { base: string }) {
  const pathname = usePathname();
  const inicio =
    pathname === base || pathname.startsWith(`${base}/tarjeta`);
  const qr = pathname.startsWith(`${base}/escanear`);

  const item =
    "flex flex-1 flex-col items-center gap-0.5 pt-2 text-[11px] font-medium";
  const label = (on: boolean) => (on ? "text-brand" : "text-ink-soft");
  const icon = (on: boolean) => `size-6 ${on ? "text-brand" : "text-ink-soft"}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-100 bg-white">
      <div className="mx-auto flex h-[64px] w-full max-w-md items-stretch px-6 pb-2">
        <Link href={base} className={item} aria-current={inicio ? "page" : undefined}>
          <IconCard className={icon(inicio)} />
          <span className={label(inicio)}>Mi tarjeta</span>
        </Link>
        <Link href={`${base}/escanear`} className={item} aria-current={qr ? "page" : undefined}>
          <IconQr className={icon(qr)} />
          <span className={label(qr)}>Mi QR</span>
        </Link>
      </div>
    </nav>
  );
}
