import { TitleBar } from "../../_components/chrome";
import { LOYALTY_TERMS_SECTIONS } from "@/lib/legal/terms-content";

export const instant = false;

export default async function Terminos({
  params,
}: PageProps<"/t/[token]/perfil/terminos">) {
  const { token } = await params;
  const base = `/t/${token}`;
  const sections = LOYALTY_TERMS_SECTIONS;

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
