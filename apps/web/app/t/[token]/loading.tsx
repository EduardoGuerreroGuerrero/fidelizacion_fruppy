// Esqueleto de la app del cliente: la barra de tabs (layout) sigue visible
// y el contenido muestra un placeholder mientras llega la página.
export default function CardLoading() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse space-y-4 px-5 pt-6">
      <div className="h-6 w-40 rounded-full bg-neutral-200/70" />
      <div className="aspect-[1.6] rounded-3xl bg-neutral-100" />
      <div className="h-16 rounded-2xl bg-neutral-100" />
      <div className="h-16 rounded-2xl bg-neutral-100" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
