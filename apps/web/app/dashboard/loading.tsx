// Esqueleto del panel (selector de organizaciones / nueva organización).
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Cargando" className="mx-auto max-w-2xl animate-pulse space-y-4">
      <div className="h-9 w-72 rounded-full bg-neutral-200/70" />
      <div className="h-4 w-96 max-w-full rounded-full bg-neutral-200/70" />
      <div className="h-20 rounded-2xl bg-neutral-100" />
      <div className="h-20 rounded-2xl bg-neutral-100" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
