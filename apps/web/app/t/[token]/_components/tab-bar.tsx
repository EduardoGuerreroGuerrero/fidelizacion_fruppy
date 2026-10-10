"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDots,
  IconGift,
  IconHome,
  IconPercent,
  IconQr,
  IconStore,
  IconUser,
} from "./icons";

// Barra inferior estilo app: 5 tabs. El 5.º es contextual — en las pantallas
// secundarias muestra el icono y nombre de la sección activa (como en los
// mockups: "Nuestras sedes" en sedes, "Mi perfil" en perfil).
export function TabBar({ base }: { base: string }) {
  const pathname = usePathname();
  const at = (suffix: string) =>
    suffix === "" ? pathname === base : pathname.startsWith(`${base}/${suffix}`);

  const inicio = at("");
  const bonos = at("bonos");
  const escanear = at("escanear");
  const promos = at("promociones");
  const sedes = at("sedes");
  const perfil = at("perfil");

  const item =
    "flex flex-1 flex-col items-center gap-0.5 pt-2 text-[10px] font-medium";
  const label = (on: boolean, pink = false) =>
    on ? (pink ? "text-accent" : "text-brand") : "text-ink-soft";
  const icon = (on: boolean, pink = false) =>
    `size-6 ${on ? (pink ? "text-accent" : "text-brand") : "text-ink-soft"}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-100 bg-white">
      <div className="mx-auto flex h-[68px] w-full max-w-md items-stretch px-2 pb-2">
        <Link href={base} className={item}>
          <IconHome className={icon(inicio)} />
          <span className={label(inicio)}>Inicio</span>
        </Link>
        <Link href={`${base}/bonos`} className={item}>
          <IconGift className={icon(bonos)} />
          <span className={label(bonos)}>Mis bonos</span>
        </Link>
        <Link href={`${base}/escanear`} className={item}>
          {escanear ? (
            <span className="-mt-7 flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
              <IconQr className="size-6" />
            </span>
          ) : (
            <IconQr className={icon(false)} />
          )}
          <span className={label(escanear)}>Escanear</span>
        </Link>
        <Link href={`${base}/promociones`} className={item}>
          <IconPercent className={icon(promos)} />
          <span className={label(promos)}>Promociones</span>
        </Link>
        {sedes ? (
          <Link href={`${base}/sedes`} className={item}>
            <IconStore className={icon(true, true)} />
            <span className={label(true, true)}>Nuestras sedes</span>
          </Link>
        ) : perfil ? (
          <Link href={`${base}/perfil`} className={item}>
            <IconUser className={icon(true)} />
            <span className={label(true)}>Mi perfil</span>
          </Link>
        ) : (
          <Link href={`${base}/perfil`} className={item}>
            <IconDots className={icon(false)} />
            <span className={label(false)}>Más</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
