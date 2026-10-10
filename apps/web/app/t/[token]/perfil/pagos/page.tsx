import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";
import { IconCard, IconQr } from "../../_components/icons";

export const instant = false;

export default async function MetodosPago({
  params,
}: PageProps<"/t/[token]/perfil/pagos">) {
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
      <TitleBar title="Métodos de pago" href={`${base}/perfil`} />

      <div className="mx-5 mt-4 rounded-[26px] bg-pastel-mint p-6 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
          <IconQr className="size-8 text-brand" />
        </span>
        <p className="mt-4 font-semibold text-ink">Tu tarjeta es tu pase</p>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
          No necesitas agregar métodos de pago: tus visitas y sellos se
          registran escaneando tu código QR en caja, y pagas como prefieras en
          el punto de venta.
        </p>
      </div>

      <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
        <IconCard className="size-6 shrink-0 text-ink-soft" />
        <p className="text-[13px] leading-snug text-ink-soft">
          Cuando {card.org_name} habilite pagos desde la app, tus métodos
          aparecerán aquí.
        </p>
      </div>
    </>
  );
}
