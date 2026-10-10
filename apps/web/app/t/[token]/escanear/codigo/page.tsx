import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";
import { CopyButton } from "../../_components/interactive";
import { IconInfo } from "../../_components/icons";

export const instant = false;

// Código de la tarjeta en texto: para cuando el QR no se puede escanear, el
// equipo lo digita a mano en el punto de venta.
export default async function CodigoManual({
  params,
}: PageProps<"/t/[token]/escanear/codigo">) {
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

  // Token en grupos de 4 para dictarlo/leerlo fácil.
  const grouped = token.replace(/(.{4})/g, "$1 ").trim();

  return (
    <>
      <TitleBar title="Código de tarjeta" href={`${base}/escanear`} />

      <div className="mx-5 mt-4 rounded-[26px] bg-pastel-mint p-6 text-center">
        <p className="text-sm text-ink-soft">
          Código de tu tarjeta, {card.first_name}
        </p>
        <p className="mt-4 break-all font-mono text-lg font-semibold leading-relaxed tracking-wider text-ink">
          {grouped}
        </p>
        <div className="mt-6">
          <CopyButton text={token} />
        </div>
      </div>

      <div className="mx-5 mt-5 flex gap-3 rounded-2xl bg-neutral-50 p-4">
        <IconInfo className="size-5 shrink-0 text-brand" />
        <p className="text-[13px] leading-snug text-ink-soft">
          Si el código QR no se puede escanear, el equipo del punto de venta
          puede ingresar este código manualmente para registrar tu visita y tus
          sellos.
        </p>
      </div>
    </>
  );
}
