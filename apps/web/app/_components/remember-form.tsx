"use client";

import { useEffect, type ComponentProps } from "react";

// Formularios con server action que, ante un error de validación, redirigen a
// la misma página con ?error=… (o ?warn=…): sin esto el usuario perdía todo
// lo escrito. Al enviar se guardan los valores (en sessionStorage, nunca las
// contraseñas ni archivos) y, si la página vuelve con error/aviso, se
// restauran. Con éxito la URL no trae error y el borrador se descarta.
//
// Uso: reemplaza <form> por <RememberForm storageKey="clave-unica" …>.

const SKIP_TYPES = new Set(["password", "file", "hidden", "submit", "button"]);

function fieldsOf(form: HTMLFormElement): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] {
  return Array.from(form.elements).filter(
    (el): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      (el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement) &&
      !!el.name &&
      !el.name.startsWith("$ACTION") &&
      !SKIP_TYPES.has((el as HTMLInputElement).type),
  );
}

type Draft = Record<string, string | boolean>;

export function RememberForm({
  storageKey,
  onSubmit,
  ...props
}: ComponentProps<"form"> & { storageKey: string }) {
  const key = `remember-form:${storageKey}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      sessionStorage.removeItem(key);
      const q = new URLSearchParams(window.location.search);
      if (!q.has("error") && !q.has("warn")) return;
      const draft = JSON.parse(raw) as Draft;
      const form = document.querySelector<HTMLFormElement>(`form[data-remember="${storageKey}"]`);
      if (!form) return;
      for (const el of fieldsOf(form)) {
        if (!(el.name in draft)) continue;
        const v = draft[el.name];
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
          el.checked = el.type === "radio" ? el.value === v : v === true;
        } else if (typeof v === "string") {
          el.value = v;
        }
      }
    } catch {
      // sin sessionStorage (modo privado): el formulario simplemente queda vacío
    }
  }, [key, storageKey]);

  return (
    <form
      {...props}
      data-remember={storageKey}
      onSubmit={(e) => {
        onSubmit?.(e);
        try {
          const draft: Draft = {};
          for (const el of fieldsOf(e.currentTarget)) {
            if (el instanceof HTMLInputElement && el.type === "checkbox") draft[el.name] = el.checked;
            else if (el instanceof HTMLInputElement && el.type === "radio") {
              if (el.checked) draft[el.name] = el.value;
            } else draft[el.name] = el.value;
          }
          sessionStorage.setItem(key, JSON.stringify(draft));
        } catch {
          /* ignorar */
        }
      }}
    />
  );
}
