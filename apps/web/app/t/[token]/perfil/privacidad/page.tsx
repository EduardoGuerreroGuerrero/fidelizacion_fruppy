import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";

export const instant = false;

export default async function Privacidad({
  params,
}: PageProps<"/t/[token]/perfil/privacidad">) {
  const { token } = await params;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  const sections: [string, string][] = [
    [
      "Qué datos usamos",
      "Tu tarjeta muestra solo tu nombre, tu progreso en el programa y tus visitas. El código QR de tu tarjeta no contiene tu correo, tu teléfono ni otros datos personales.",
    ],
    [
      "Para qué los usamos",
      "Los datos se usan exclusivamente para operar el programa de fidelización: registrar visitas, acumular sellos o puntos y entregarte las recompensas que ganes.",
    ],
    [
      "Quién puede verlos",
      "Solo el equipo autorizado del comercio accede a la información completa de tu cuenta para operar el programa. No vendemos ni compartimos tus datos con terceros ajenos al programa.",
    ],
    [
      "Tus derechos",
      "Puedes conocer, actualizar o eliminar tus datos personales en cualquier momento acercándote a una sede del comercio, conforme a la normativa de protección de datos personales vigente.",
    ],
  ];

  return (
    <>
      <TitleBar title="Política de privacidad" href={`${base}/perfil`} />
      <div className="mx-5 mt-2 space-y-4 pb-4">
        <p className="text-sm leading-relaxed text-ink-soft">
          Así cuidamos tu información en {card?.org_name ?? "el programa"}. Tu
          confianza es lo primero.
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
