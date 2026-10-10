import Link from "next/link";
import { IconBack, IconBell } from "./icons";

// Encabezado de pantalla interna: flecha atrás + título centrado.
export function TitleBar({
  title,
  href,
  action,
}: {
  title: string;
  href: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="relative flex h-14 items-center justify-center px-5">
      <Link
        href={href}
        aria-label="Volver"
        className="absolute left-4 rounded-full p-1.5 text-ink transition hover:bg-neutral-100"
      >
        <IconBack className="size-6" />
      </Link>
      <h1 className="text-[17px] font-semibold text-ink">{title}</h1>
      {action ? <div className="absolute right-4">{action}</div> : null}
    </header>
  );
}

// Encabezado del Inicio: avatar con iniciales, saludo y campana.
export function HomeHeader({ firstName }: { firstName: string }) {
  const initials = firstName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <header className="flex items-center gap-3 px-5 pt-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-pastel-pink text-sm font-semibold text-accent">
        {initials}
      </span>
      <div className="flex-1">
        <p className="text-[17px] font-semibold text-ink">¡Hola {firstName}!</p>
        <p className="text-xs text-ink-soft">Qué bueno verte por aquí</p>
      </div>
      <span className="relative rounded-full p-2 text-ink">
        <IconBell className="size-6" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />
      </span>
    </header>
  );
}

// Título de sección con acción a la derecha ("Ver todas").
export function Section({
  title,
  actionHref,
  actionLabel = "Ver todas",
  actionText,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  actionText?: string;
}) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between px-5">
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      {actionHref ? (
        <Link href={actionHref} className="text-sm font-medium text-brand">
          {actionLabel}
        </Link>
      ) : null}
      {actionText ? (
        <span className="text-sm font-semibold text-brand">{actionText}</span>
      ) : null}
    </div>
  );
}
