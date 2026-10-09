import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scanCard } from "@/lib/loyalty/actions";

export const instant = false;

// Flujo de empleado: pega el token del QR (o llega vía ?token= del escáner
// del navegador) y registra visita + sellos en una sola acción.
export default async function ScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ token?: string; error?: string; ok?: string }>;
}) {
  const { org: slug } = await params;
  const { token = "", error, ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const action = scanCard.bind(null, slug);

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-neutral-500">
        <Link href={`/dashboard/${slug}`} className="hover:underline">
          {org.name}
        </Link>{" "}
        / Escanear tarjeta
      </p>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">Registrar visita</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
          ✕ {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          ✓ {ok}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="token" className="mb-1 block text-sm font-medium">
            Token del QR
          </label>
          <input
            id="token"
            name="token"
            defaultValue={token}
            required
            autoFocus
            autoComplete="off"
            placeholder="Pega aquí el token escaneado"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-transparent"
          />
          <p className="mt-1 text-xs text-neutral-500">
            El QR del cliente apunta a /t/&lt;token&gt;. El escáner del navegador puede abrir esta
            página con ?token=…
          </p>
        </div>
        <div>
          <label htmlFor="stamps" className="mb-1 block text-sm font-medium">
            Sellos a otorgar
          </label>
          <input
            id="stamps"
            name="stamps"
            type="number"
            min={0}
            max={20}
            defaultValue={1}
            className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Registrar visita
        </button>
      </form>
    </div>
  );
}
