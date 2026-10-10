import Link from "next/link";
import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";
import { IconChat, IconPin, IconStore } from "../../_components/icons";

export const instant = false;

export default async function Contacto({
  params,
}: PageProps<"/t/[token]/perfil/contacto">) {
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

  return (
    <>
      <TitleBar title="Contáctanos" href={`${base}/perfil`} />

      <div className="mx-5 mt-4 rounded-[26px] bg-pastel-mint p-6 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
          <IconChat className="size-8 text-brand" />
        </span>
        <p className="mt-4 font-semibold text-ink">Estamos para ayudarte</p>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
          El equipo de {card.org_name} resolverá tus dudas sobre sellos,
          recompensas y tu tarjeta.
        </p>
      </div>

      <Link
        href={`${base}/sedes`}
        className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft">
          <IconPin className="size-5 text-brand" />
        </span>
        <span className="flex-1">
          <span className="block font-medium text-ink">
            Visítanos en nuestras sedes
          </span>
          <span className="block text-xs text-ink-soft">
            {card.locations.length > 0
              ? `${card.locations.length} sede${card.locations.length === 1 ? "" : "s"} disponible${card.locations.length === 1 ? "" : "s"}`
              : "Consulta horarios y direcciones"}
          </span>
        </span>
        <IconStore className="size-5 text-ink-soft" />
      </Link>

      <ul className="mx-5 mt-4 space-y-2">
        {card.locations.slice(0, 3).map((l) => (
          <li
            key={l.id}
            className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm"
          >
            <span className="font-medium text-ink">{l.name}</span>
            {l.address ? (
              <span className="block text-xs text-ink-soft">{l.address}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
