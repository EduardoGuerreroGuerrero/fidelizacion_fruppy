import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";
import { PrefToggle } from "../../_components/interactive";

export const instant = false;

export default async function Notificaciones({
  params,
}: PageProps<"/t/[token]/perfil/notificaciones">) {
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
      <TitleBar title="Notificaciones" href={`${base}/perfil`} />

      <p className="mx-5 mt-2 text-sm text-ink-soft">
        Elige qué quieres recibir de {card.org_name}.
      </p>

      <ul className="mx-5 mt-4 divide-y divide-neutral-100 rounded-[26px] bg-white shadow-sm ring-1 ring-neutral-100">
        <PrefToggle
          storageKey={`notif-${token}-promos`}
          title="Promociones y ofertas"
          subtitle="Descuentos, 2x1 y promos de temporada"
        />
        <PrefToggle
          storageKey={`notif-${token}-rewards`}
          title="Recompensas"
          subtitle="Cuando completes una recompensa"
        />
        <PrefToggle
          storageKey={`notif-${token}-stamps`}
          title="Recordatorio de sellos"
          subtitle="Te avisamos cuando te falte poco"
          defaultOn={false}
        />
        <PrefToggle
          storageKey={`notif-${token}-news`}
          title="Novedades"
          subtitle="Nuevas sedes, sabores y más"
          defaultOn={false}
        />
      </ul>
    </>
  );
}
