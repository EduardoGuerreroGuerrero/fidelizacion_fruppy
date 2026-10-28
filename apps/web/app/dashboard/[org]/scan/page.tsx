import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
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
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  // Tipos de programa activos: define qué campo(s) mostrar (sellos / monto).
  const { data: progs } = await supabase
    .from("loyalty_programs")
    .select("program_type")
    .eq("organization_id", org.id)
    .eq("status", "active");
  const types = new Set((progs ?? []).map((p) => p.program_type));
  const hasPoints = types.has("points");
  // Sin programas activos se conserva el comportamiento histórico (sellos).
  const hasStamps = types.has("stamps") || !hasPoints;

  const action = scanCard.bind(null, slug);

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-ink-soft">
        <Link href={`/dashboard/${slug}`} className="hover:underline">
          {org.name}
        </Link>{" "}
        / Escanear tarjeta
      </p>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">Registrar visita</h1>

      {error && (
        <p className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
          ✕ {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-xl bg-pastel-mint px-4 py-3 text-sm font-medium text-brand-dark">
          ✓ {ok}
        </p>
      )}

      <ScanForm
        action={action}
        initialToken={token}
        hasStamps={hasStamps}
        hasPoints={hasPoints}
      />
      <p className="mt-3 text-xs text-ink-soft">
        Usa la cámara, un lector USB que escriba el token, o pégalo manualmente.
      </p>
    </div>
  );
}
