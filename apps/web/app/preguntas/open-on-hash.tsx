"use client";

import { useEffect } from "react";

// Abre la pregunta (<details id="…">) a la que apunta el #ancla de la URL, p. ej.
// /preguntas#wallet, y baja hasta ella. También al cambiar el hash en la misma página.
export function OpenOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
