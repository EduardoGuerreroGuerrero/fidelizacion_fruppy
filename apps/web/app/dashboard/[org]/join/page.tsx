import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rotateJoinToken } from "@/lib/admin/actions";

export const instant = false;

// QR de autorregistro del comercio: la URL contiene el join_token opaco,
// nunca el id ni PII del comercio. Rotable ante abuso/fuga (admin+).
export default async function JoinQrPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { org: slug } = await params;
  const { error, ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, join_token, features")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const selfReg =
    ((org.features ?? {}) as Record<string, unknown>).self_registration !== false;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const joinUrl = `${baseUrl}/join/${org.join_token}`;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">QR de registro de clientes</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {ok}
        </p>
      )}

      {!selfReg ? (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          El autorregistro está desactivado en Configuración → Privacidad y
          funciones. El QR no funcionará hasta activarlo.
        </p>
      ) : null}

      <section className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Imprime este QR en el punto de venta. El cliente lo escanea, se
          registra solo y recibe su tarjeta por correo — sin intervención del
          equipo.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/dashboard/${slug}/join/qr`}
            alt="QR de registro"
            width={260}
            height={260}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800"
          />
          <code className="break-all rounded-md bg-neutral-100 px-3 py-2 text-xs dark:bg-neutral-800">
            {joinUrl}
          </code>
        </div>
        <form action={rotateJoinToken.bind(null, slug)} className="mt-4">
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Rotar QR (invalida el anterior)
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-soft">
          Rótalo si el QR se filtró o aparecen registros sospechosos. Los
          clientes ya registrados conservan su tarjeta.
        </p>
      </section>
    </div>
  );
}
