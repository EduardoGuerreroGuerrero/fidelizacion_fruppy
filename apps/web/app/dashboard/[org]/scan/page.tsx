import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scanCard } from "@/lib/loyalty/actions";
import { ScanForm } from "./scan-form";

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

      <ScanForm action={action} initialToken={token} />
      <p className="mt-3 text-xs text-neutral-500">
        Usa la cámara, un lector USB que escriba el token, o pégalo manualmente.
      </p>
    </div>
  );
}
