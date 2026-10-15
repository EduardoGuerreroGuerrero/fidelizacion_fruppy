import { createClient } from "@/lib/supabase/server";
import { TitleBar } from "../../_components/chrome";
import { getCardAppData } from "../../_components/data";
import { PushToggle } from "../../_components/push";

export const instant = false;

type CardConsents = {
  org_name: string;
  push_enabled: boolean;
  location_enabled: boolean;
  consents: Record<string, "granted" | "withdrawn">;
};

// Centro de preferencias del cliente, respaldado por customer_consents en
// la base de datos — ya no es localStorage. Cada canal/finalidad es
// independiente y cada cambio queda como evento auditable.
export default async function Notificaciones({
  params,
}: PageProps<"/t/[token]/perfil/notificaciones">) {
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

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_card_consents", { p_token: token });
  const prefs = (data ?? null) as CardConsents | null;
  const consents = prefs?.consents ?? {};
  const marketingOn = consents.marketing_email === "granted";
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <>
      <TitleBar title="Notificaciones" href={`${base}/perfil`} />

      <p className="mx-5 mt-2 text-sm text-ink-soft">
        Elige qué quieres recibir de {card.org_name}. Cada opción es
        independiente y puedes cambiarla cuando quieras.
      </p>

      <ul className="mx-5 mt-4 divide-y divide-neutral-100 rounded-[26px] bg-white shadow-sm ring-1 ring-neutral-100">
        {/* Push: requiere JS (Push API) — suscripción técnica + autorización
            comercial registradas juntas en el servidor */}
        {prefs?.push_enabled && vapidKey ? (
          <li>
            <PushToggle
              token={token}
              orgName={card.org_name}
              vapidPublicKey={vapidKey}
              initialOn={consents.push_notifications === "granted"}
            />
          </li>
        ) : null}

        {/* Marketing por correo: formulario clásico, funciona sin JS */}
        <li className="flex items-center gap-3 px-5 py-3.5">
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-ink">Promociones por correo</span>
            <span className="block text-xs text-ink-soft">
              Descuentos y novedades de {card.org_name} en tu email
            </span>
          </span>
          <form method="post" action={`${base}/prefs`}>
            <input type="hidden" name="purpose" value="marketing_email" />
            <input type="hidden" name="granted" value={marketingOn ? "0" : "1"} />
            <button
              type="submit"
              role="switch"
              aria-checked={marketingOn}
              className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${
                marketingOn ? "bg-brand" : "bg-neutral-200"
              }`}
            >
              <span
                className={`block size-5 rounded-full bg-white shadow transition ${
                  marketingOn ? "translate-x-5" : ""
                }`}
              />
            </button>
          </form>
        </li>

        {/* Ubicación: solo informativa — el permiso real lo pide el
            navegador al usar la función concreta (sedes cercanas) */}
        {prefs?.location_enabled ? (
          <li className="flex items-center gap-3 px-5 py-3.5">
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">Ubicación</span>
              <span className="block text-xs text-ink-soft">
                Solo se usa si pides ver sedes cercanas; no se guarda
              </span>
            </span>
            <form method="post" action={`${base}/prefs`}>
              <input type="hidden" name="purpose" value="location" />
              <input
                type="hidden"
                name="granted"
                value={consents.location === "granted" ? "0" : "1"}
              />
              <button
                type="submit"
                role="switch"
                aria-checked={consents.location === "granted"}
                className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${
                  consents.location === "granted" ? "bg-brand" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`block size-5 rounded-full bg-white shadow transition ${
                    consents.location === "granted" ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </form>
          </li>
        ) : null}
      </ul>

      <p className="mx-5 mt-4 text-[11px] leading-snug text-ink-soft">
        Rechazar cualquiera de estas opciones no afecta tu tarjeta ni tus
        sellos. Si bloqueas las notificaciones en el navegador, puedes
        cambiarlo desde la configuración del sitio.
      </p>
    </>
  );
}
