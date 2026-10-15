import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";

export const instant = false;

const TYPE_LABEL: Record<string, string> = {
  access: "Conocer los datos que tienen de mí",
  rectification: "Corregir o actualizar mis datos",
  revocation: "Retirar mi autorización de tratamiento",
  erasure: "Eliminar mis datos",
  complaint: "Presentar un reclamo",
};

const select =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

// Derechos del titular (Ley 1581 — habeas data): la solicitud llega al
// comercio del QR, que tiene 15 días hábiles (consulta) o 10 (reclamo)
// para responder.
export default async function Derechos({
  params,
  searchParams,
}: PageProps<"/t/[token]/perfil/derechos">) {
  const { token } = await params;
  const { enviado, error } = await searchParams;
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
      <TitleBar title="Tus derechos" href={`${base}/perfil`} />

      <p className="mx-5 mt-2 text-sm leading-snug text-ink-soft">
        Sobre los datos que {card.org_name} trata en este programa puedes
        ejercer tus derechos de titular. La respuesta llega al correo con el
        que te registraste.
      </p>

      {enviado ? (
        <p className="mx-5 mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Solicitud enviada. {card.org_name} tiene hasta 15 días hábiles para
          responder.
        </p>
      ) : null}
      {error ? (
        <p className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <form
        method="post"
        action={`${base}/rights`}
        className="mx-5 mt-4 space-y-4 rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-neutral-100"
      >
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-ink">
            ¿Qué quieres solicitar?
          </label>
          <select id="type" name="type" required className={select}>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="detail" className="mb-1.5 block text-sm font-medium text-ink">
            Detalle <span className="text-ink-soft">(opcional)</span>
          </label>
          <textarea
            id="detail"
            name="detail"
            rows={3}
            maxLength={2000}
            placeholder="Cuéntanos brevemente tu solicitud"
            className={select}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand py-3.5 text-[15px] font-semibold text-white"
        >
          Enviar solicitud
        </button>
      </form>

      <p className="mx-5 mt-4 text-[11px] leading-snug text-ink-soft">
        Retirar la autorización de tratamiento puede implicar el cierre de tu
        tarjeta cuando los datos sean indispensables para el programa.
      </p>
    </>
  );
}
