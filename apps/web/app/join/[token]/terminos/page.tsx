import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LOYALTY_TERMS_SECTIONS } from "@/lib/legal/terms-content";
import { IconBack } from "@/app/t/[token]/_components/icons";

export const instant = false;

type JoinInfo = { ok: boolean; org_name?: string };

// Términos y condiciones del programa, legibles ANTES de registrarse —
// enlazados desde /join/{token} junto a la política de tratamiento.
export default async function JoinTerminos({
  params,
}: PageProps<"/join/[token]/terminos">) {
  const { token } = await params;
  const supabase = await createClient();
  const info = (await supabase
    .rpc("resolve_join", { p_token: token })
    .then((r) => r.data)) as JoinInfo | null;

  if (!info?.ok) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-white px-6">
        <p className="rounded-2xl bg-neutral-50 p-8 text-center text-sm text-ink-soft">
          Este enlace no es válido.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-white px-5 pb-10 pt-6">
      <Link
        href={`/join/${token}`}
        aria-label="Volver"
        className="-ml-1.5 flex size-9 items-center justify-center rounded-full text-ink hover:bg-neutral-100"
      >
        <IconBack className="size-5" />
      </Link>
      <h1 className="mt-3 text-xl font-semibold text-ink">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Condiciones de uso del programa de fidelización de {info.org_name}.
      </p>
      <div className="mt-5 space-y-4">
        {LOYALTY_TERMS_SECTIONS.map(([t, body]) => (
          <div key={t}>
            <p className="font-semibold text-ink">{t}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
