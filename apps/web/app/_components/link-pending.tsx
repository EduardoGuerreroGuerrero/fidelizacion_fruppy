"use client";

import { useLinkStatus } from "next/link";

// Indicador dentro de un <Link>: aparece en cuanto se hace clic y se va al
// terminar la navegación. Sin esto, mientras el servidor responde la
// página no cambia y el clic parece no haberse registrado.
// Debe renderizarse como descendiente del <Link>.
export function LinkPending({ className = "size-3" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${
        pending ? "inline-block opacity-70" : "hidden"
      } ${className}`}
    />
  );
}
