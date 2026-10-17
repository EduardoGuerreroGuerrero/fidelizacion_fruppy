"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "../_landing/icons";

export default function PasswordInput() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name="password"
        type={show ? "text" : "password"}
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        className="w-full rounded-xl border border-ink/10 bg-neutral-50 px-4 py-3 pr-11 text-sm outline-none transition focus:border-pl-green-2 focus:ring-2 focus:ring-pl-green-2/30"
      />
      <button
        type="button"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-ink"
      >
        {show ? (
          <IconEyeOff className="h-4.5 w-4.5" />
        ) : (
          <IconEye className="h-4.5 w-4.5" />
        )}
      </button>
    </div>
  );
}
