import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Fruppy</h1>
      <p className="max-w-md text-lg text-neutral-600 dark:text-neutral-400">
        Fidelización, CRM y tarjetas digitales para comercios locales.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Registrar comercio
        </Link>
      </div>
    </main>
  );
}
