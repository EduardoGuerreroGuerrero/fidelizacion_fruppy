import { getCardAppData } from "../../_components/data";
import { TitleBar } from "../../_components/chrome";
import { IconInfo } from "../../_components/icons";

export const instant = false;

export default async function DatosPersonales({
  params,
}: PageProps<"/t/[token]/perfil/datos">) {
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

  const rows: [string, string][] = [
    ["Nombre", card.first_name],
    ["Programa", card.program_name],
    ["Comercio", card.org_name],
    ["Estado", card.card_status === "active" ? "Cliente activo" : "Tarjeta inactiva"],
  ];

  return (
    <>
      <TitleBar title="Mis datos personales" href={`${base}/perfil`} />

      <ul className="mx-5 mt-2 divide-y divide-neutral-100 rounded-[26px] bg-white shadow-sm ring-1 ring-neutral-100">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-ink-soft">{label}</span>
            <span className="text-sm font-medium text-ink">{value}</span>
          </li>
        ))}
      </ul>

      <div className="mx-5 mt-5 flex gap-3 rounded-2xl bg-pastel-mint p-4">
        <IconInfo className="size-5 shrink-0 text-brand" />
        <p className="text-[13px] leading-snug text-ink">
          Para actualizar tu correo, teléfono o nombre, acércate a cualquiera de
          nuestras sedes y el equipo te ayudará.
        </p>
      </div>
    </>
  );
}
