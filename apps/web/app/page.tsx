import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-pastel-mint/40 p-8 text-center">
      {/* Nivel SaaS: sin logo de ningún comercio. */}
      <h1 className="text-4xl font-bold tracking-tight text-ink">Fidelización</h1>
      <p className="max-w-md text-lg text-ink-soft">
        CRM y tarjetas digitales para comercios locales.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-neutral-200 transition hover:ring-brand/50"
        >
          Registrar comercio
        </Link>
      </div>
    </main>
  );
}
