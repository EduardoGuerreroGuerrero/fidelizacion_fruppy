"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

// Botón de envío para formularios con server action:
//  - mientras la acción corre queda deshabilitado y muestra `pendingText`
//    (evita el doble clic / doble registro);
//  - `confirm` pide confirmación antes de acciones irreversibles.
export function SubmitButton({
  children,
  pendingText = "Procesando…",
  confirm,
  disabled,
  onClick,
  ...props
}: ComponentProps<"button"> & { pendingText?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
