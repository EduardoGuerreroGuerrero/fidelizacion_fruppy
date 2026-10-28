// Esqueleto que aparece en cuanto se navega entre secciones del org: el
// layout (logo + menú) ya está montado y solo la página espera al servidor.
// Sin este archivo la navegación bloqueaba sin feedback visible.
export default function OrgLoading() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse space-y-4">
      <div className="h-4 w-40 rounded-full bg-neutral-200/70" />
      <div className="h-8 w-64 rounded-full bg-neutral-200/70" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-neutral-100" />
        <div className="h-24 rounded-2xl bg-neutral-100" />
        <div className="h-24 rounded-2xl bg-neutral-100" />
      </div>
      <div className="h-64 rounded-2xl bg-neutral-100" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
