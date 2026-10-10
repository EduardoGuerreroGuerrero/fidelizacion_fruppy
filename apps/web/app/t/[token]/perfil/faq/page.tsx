import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";

export const instant = false;

const FAQS = [
  {
    q: "¿Cómo gano sellos?",
    a: "Muestra tu código QR en caja cada vez que nos visites. El equipo lo escanea y tu sello se suma automáticamente a tu tarjeta.",
  },
  {
    q: "¿Cómo canjeo una recompensa?",
    a: "Cuando completes los sellos o puntos necesarios, ve a Mis bonos, elige tu recompensa y muestra tu QR en caja. El equipo registra el canje al momento.",
  },
  {
    q: "¿Mis sellos vencen?",
    a: "Tus sellos se mantienen mientras tu tarjeta esté activa. Si el programa define una política de vencimiento, te avisaremos con anticipación.",
  },
  {
    q: "¿Qué pasa si pierdo el enlace a mi tarjeta?",
    a: "El código QR de tu tarjeta es único. Si lo pierdes, acércate a una sede y el equipo te emitirá una nueva tarjeta conservando tu saldo.",
  },
  {
    q: "¿Puedo usar mi tarjeta en todas las sedes?",
    a: "Sí, tu tarjeta digital funciona en todas las sedes del comercio. Revisa la lista completa en Nuestras sedes.",
  },
];

export default async function PreguntasFrecuentes({
  params,
}: PageProps<"/t/[token]/perfil/faq">) {
  const { token } = await params;
  const base = `/t/${token}`;
  const card = await getCardAppData(token);

  return (
    <>
      <TitleBar title="Preguntas frecuentes" href={`${base}/perfil`} />

      <div className="mx-5 mt-2 space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 open:ring-brand/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="text-brand transition group-open:rotate-90">›</span>
            </summary>
            <p className="mt-2 text-[13px] leading-snug text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>

      {card ? (
        <p className="mx-5 mt-6 rounded-2xl bg-pastel-mint p-4 text-[13px] text-ink">
          ¿Otra duda? Escríbenos desde{" "}
          <a href={`${base}/perfil/contacto`} className="font-semibold text-brand">
            Contáctanos
          </a>{" "}
          o pregúntale al equipo en tu próxima visita.
        </p>
      ) : null}
    </>
  );
}
