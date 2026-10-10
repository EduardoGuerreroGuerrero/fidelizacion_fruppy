import { TitleBar } from "../../_components/chrome";

export const instant = false;

export default async function Terminos({
  params,
}: PageProps<"/t/[token]/perfil/terminos">) {
  const { token } = await params;
  const base = `/t/${token}`;

  const sections: [string, string][] = [
    [
      "1. El programa",
      "La tarjeta digital te permite acumular sellos o puntos por tus visitas al comercio y canjearlos por las recompensas publicadas en la app. El programa es gratuito y personal: tu tarjeta es intransferible.",
    ],
    [
      "2. Acumulación",
      "Los sellos o puntos se registran únicamente al escanear tu código QR en el punto de venta, en el momento de la compra. No se acreditan visitas con retroactividad ni mediante comprobantes posteriores.",
    ],
    [
      "3. Canje de recompensas",
      "Cada recompensa indica el número de sellos o puntos requeridos y sus condiciones. El canje se realiza solo en el punto de venta, con validación del saldo por parte del equipo. Las recompensas no son canjeables por dinero en efectivo.",
    ],
    [
      "4. Tu código QR",
      "Tu código es tu credencial de acceso a la tarjeta. No lo compartas con terceros; quien lo presente podrá ver tu progreso. Si lo pierdes o sospechas que alguien más lo usa, solicita una nueva tarjeta en cualquier sede.",
    ],
    [
      "5. Cambios al programa",
      "El comercio puede ajustar recompensas, promociones y condiciones, avisando por los canales habituales de la app. El uso continuo de la tarjeta implica la aceptación de los términos vigentes.",
    ],
  ];

  return (
    <>
      <TitleBar title="Términos y condiciones" href={`${base}/perfil`} />
      <div className="mx-5 mt-2 space-y-4 pb-4">
        <p className="text-sm leading-relaxed text-ink-soft">
          Condiciones de uso del programa de fidelización. Ante cualquier duda,
          consúltalas con el equipo en tienda.
        </p>
        {sections.map(([t, body]) => (
          <div key={t}>
            <p className="font-semibold text-ink">{t}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
