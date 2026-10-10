import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { TitleBar } from "../_components/chrome";
import { MenuRow } from "../_components/cards";
import {
  IconBell,
  IconCard,
  IconChat,
  IconDoc,
  IconGear,
  IconHelp,
  IconLogout,
  IconPin,
  IconShield,
  IconUser,
  StampStrawberry,
  IconGift,
} from "../_components/icons";

export const instant = false;

export default async function MiPerfil({
  params,
}: PageProps<"/t/[token]/perfil">) {
  const { token } = await params;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  if (!card) {
    return (
      <p className="m-8 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
        Tarjeta no encontrada.
      </p>
    );
  }

  const isStamps = card.program_type === "stamps" && card.stamp_goal;
  const current = isStamps ? card.current_stamps : card.current_points;

  return (
    <>
      <TitleBar
        title="Mi perfil"
        href={base}
        action={
          <Link
            href={`${base}/perfil/datos`}
            aria-label="Configuración"
            className="rounded-full p-1.5 text-ink transition hover:bg-neutral-100"
          >
            <IconGear className="size-6" />
          </Link>
        }
      />

      {/* Tarjeta de perfil */}
      <div className="relative mx-5 mt-2 overflow-hidden rounded-[28px] bg-gradient-to-br from-brand to-[#f0a040]">
        <span className="absolute -left-14 -top-16 size-52 rounded-full bg-white/10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/profile-photo.jpg"
          alt=""
          className="absolute inset-y-0 right-0 h-full w-[38%] object-cover"
        />
        <span className="absolute inset-y-0 right-[28%] w-14 bg-gradient-to-r from-black/0 to-black/10" />
        <div className="relative z-10 p-5 pb-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-circle.jpg"
            alt="Fruppy Helados"
            className="size-20 rounded-full shadow-lg"
          />
          <p className="mt-3 text-xl font-semibold text-white">
            {card.first_name}
          </p>
          <p className="text-sm text-white/85">{card.org_name}</p>
          <span className="mt-1.5 inline-block rounded-full bg-white/90 px-3 py-0.5 text-[11px] font-semibold text-brand-dark">
            Cliente activo
          </span>
        </div>
      </div>

      {/* Stats: sellos + recompensas */}
      <div className="relative z-10 mx-8 -mt-8 flex rounded-2xl bg-white p-4 shadow-lg">
        <div className="flex flex-1 items-center justify-center gap-2.5 border-r border-neutral-100">
          <StampStrawberry filled className="size-8" />
          <span>
            <span className="block text-lg font-bold leading-none tabular-nums text-ink">
              {current}
              {isStamps ? ` / ${card.stamp_goal}` : ""}
            </span>
            <span className="text-xs text-ink-soft">
              {isStamps ? "Sellos" : "Puntos"}
            </span>
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-pastel-lav">
            <IconGift className="size-5 text-[#9b6ddf]" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-none tabular-nums text-ink">
              {card.rewards.length}
            </span>
            <span className="text-xs text-ink-soft">Recompensas</span>
          </span>
        </div>
      </div>

      {/* Mi cuenta */}
      <p className="mb-1 mt-6 px-5 text-[17px] font-semibold text-ink">
        Mi cuenta
      </p>
      <ul>
        <MenuRow
          href={`${base}/perfil/datos`}
          Icon={IconUser}
          tint="bg-brand-soft text-brand"
          title="Mis datos personales"
          subtitle="Nombre, correo y teléfono"
        />
        <MenuRow
          href={`${base}/perfil/sedes-favoritas`}
          Icon={IconPin}
          tint="bg-brand-soft text-brand"
          title="Mis sedes favoritas"
          subtitle="Selecciona tus sedes preferidas"
        />
        <MenuRow
          href={`${base}/perfil/notificaciones`}
          Icon={IconBell}
          tint="bg-brand-soft text-brand"
          title="Notificaciones"
          subtitle="Promociones, novedades y más"
        />
        <MenuRow
          href={`${base}/perfil/pagos`}
          Icon={IconCard}
          tint="bg-brand-soft text-brand"
          title="Métodos de pago"
          subtitle="Administra tus métodos de pago"
        />
      </ul>

      {/* Ayuda y soporte */}
      <p className="mb-1 mt-5 px-5 text-[17px] font-semibold text-ink">
        Ayuda y soporte
      </p>
      <ul>
        <MenuRow
          href={`${base}/perfil/faq`}
          Icon={IconHelp}
          tint="bg-pastel-cream text-[#e8862e]"
          title="Preguntas frecuentes"
          subtitle="Resuelve tus dudas"
        />
        <MenuRow
          href={`${base}/perfil/contacto`}
          Icon={IconChat}
          tint="bg-pastel-cream text-[#e8862e]"
          title="Contáctanos"
          subtitle="Estamos para ayudarte"
        />
        <MenuRow
          href={`${base}/perfil/terminos`}
          Icon={IconDoc}
          tint="bg-pastel-cream text-[#e8862e]"
          title="Términos y condiciones"
          subtitle="Políticas de uso del programa"
        />
        <MenuRow
          href={`${base}/perfil/privacidad`}
          Icon={IconShield}
          tint="bg-pastel-cream text-[#e8862e]"
          title="Política de privacidad"
          subtitle="Protegemos tu información"
        />
      </ul>

      {/* Cerrar sesión */}
      <Link
        href="/"
        className="mx-5 mb-4 mt-6 flex items-center gap-3.5 rounded-2xl bg-pastel-pink p-4"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-white/70 text-accent">
          <IconLogout className="size-5" />
        </span>
        <span className="flex-1 font-medium text-accent">Cerrar sesión</span>
        <IconLogout className="size-5 text-accent" />
      </Link>
    </>
  );
}
