import Link from "next/link";
import { getCardAppData } from "../_components/data";
import { TitleBar } from "../_components/chrome";

export const instant = false;

export default async function Promociones({
  params,
}: PageProps<"/t/[token]/promociones">) {
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

  // Aún no hay catálogo de promociones por comercio (las campañas llegan por
  // push/correo): estado vacío honesto en lugar de contenido de ejemplo.
  return (
    <>
      <TitleBar title="Promociones" href={base} />
      <div className="mx-5 mt-6 rounded-3xl border border-dashed border-neutral-200 p-8 text-center">
        <p className="font-semibold text-ink">Aún no hay promociones</p>
        <p className="mt-2 text-sm text-ink-soft">
          {card.org_name} te avisará aquí de sus novedades y descuentos.
        </p>
        <Link
          href={`${base}/bonos`}
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
        >
          Ver mis recompensas
        </Link>
      </div>
    </>
  );
}
