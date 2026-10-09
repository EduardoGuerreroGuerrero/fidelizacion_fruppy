"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // TODO(observabilidad): enviar a Sentry cuando SENTRY_DSN esté configurado.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="text-sm text-neutral-500">Ocurrió un error inesperado. Inténtalo de nuevo.</p>
      <button
        onClick={() => retry()}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
      >
        Reintentar
      </button>
    </main>
  );
}
