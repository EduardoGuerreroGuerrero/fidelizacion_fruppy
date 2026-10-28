"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// Casilla Cloudflare Turnstile. Dentro de un <form>, el widget añade solo el
// campo oculto `cf-turnstile-response`, que el servidor valida (lib/antibot).
// Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no renderiza nada.
// Render explícito: sirve también tras navegar sin recargar (el script ya
// cargado no vuelve a pintar widgets nuevos por sí solo).

type TurnstileApi = {
  render: (el: HTMLElement, options: { sitekey: string; language?: string; theme?: string }) => string;
  remove: (id: string) => void;
};

export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (!siteKey || !ready || !ref.current || !api) return;
    const id = api.render(ref.current, { sitekey: siteKey, language: "es", theme: "light" });
    return () => api.remove(id);
  }, [siteKey, ready]);

  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
