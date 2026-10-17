import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";
import { defaultPolicyText } from "@/lib/legal/policy-template";

export const instant = false;

export default async function Privacidad({
  params,
}: PageProps<"/t/[token]/perfil/privacidad">) {
  const { token } = await params;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  // El comercio puede haber redactado su propia política (Configuración →
  // Privacidad y funciones); si no, se muestra la plantilla por defecto con
  // su nombre — el mismo texto que ve antes de aceptar en /join.
  const text = card?.policy_text?.trim() || defaultPolicyText(card?.org_name ?? "el comercio");

  return (
    <>
      <TitleBar title="Política de privacidad" href={`${base}/perfil`} />
      <div className="mx-5 mt-2 pb-4">
        <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink">
          {text}
        </pre>
      </div>
    </>
  );
}
