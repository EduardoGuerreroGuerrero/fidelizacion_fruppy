"use client";

import { useEffect, useState } from "react";

// Activación/desactivación de notificaciones push de ESTE comercio.
// Explicación propia primero (el botón), luego el diálogo del navegador.
// La suscripción técnica y la autorización comercial se registran juntas en
// el servidor; la baja aquí no afecta a otros comercios del mismo origen.

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "error";

export function PushToggle({
  token,
  orgName,
  vapidPublicKey,
  initialOn,
}: {
  token: string;
  orgName: string;
  vapidPublicKey: string;
  initialOn: boolean;
}) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Soporte y suscripción actual solo existen en el navegador → lectura
    // asíncrona en efecto (en SSR el estado queda "loading").
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) setState(sub && initialOn ? "on" : "off");
      } catch {
        if (!cancelled) setState(initialOn ? "on" : "off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialOn]);

  async function enable() {
    setBusy(true);
    try {
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const res = await fetch(`/t/${token}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      const r = (await res.json()) as { ok?: boolean; error?: string };
      setState(r.ok ? "on" : "error");
      if (!r.ok && Notification.permission === "denied") setState("denied");
    } catch {
      setState(Notification.permission === "denied" ? "denied" : "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch(`/t/${token}/push`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsubscribe", endpoint: sub.endpoint }),
        });
        await sub.unsubscribe().catch(() => {});
      }
      setState("off");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") {
    return (
      <p className="px-5 py-3.5 text-[13px] text-ink-soft">
        Este navegador no admite notificaciones push.
      </p>
    );
  }

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">Notificaciones de {orgName}</span>
          <span className="block text-xs text-ink-soft">
            Avisos y promociones de este comercio en tu dispositivo
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={state === "on"}
          disabled={busy || state === "loading"}
          onClick={state === "on" ? disable : enable}
          className={`h-7 w-12 shrink-0 rounded-full p-1 transition disabled:opacity-50 ${
            state === "on" ? "bg-brand" : "bg-neutral-200"
          }`}
        >
          <span
            className={`block size-5 rounded-full bg-white shadow transition ${
              state === "on" ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
      {state === "denied" ? (
        <p className="mt-2 text-xs leading-snug text-ink-soft">
          El navegador tiene las notificaciones bloqueadas para este sitio. Si
          quieres activarlas, hazlo desde el candado de la barra de direcciones
          → Configuración del sitio → Notificaciones.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="mt-2 text-xs text-red-600">
          No se pudo actualizar. Inténtalo de nuevo.
        </p>
      ) : null}
      {state === "off" ? (
        <p className="mt-2 text-[11px] leading-snug text-ink-soft">
          Al activarlas aceptas recibir notificaciones de {orgName}. Puedes
          desactivarlas cuando quieras desde esta misma pantalla.
        </p>
      ) : null}
    </div>
  );
}
