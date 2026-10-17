import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { defaultPolicyText } from "@/lib/legal/policy-template";
import { IconBack } from "@/app/t/[token]/_components/icons";

export const instant = false;

type JoinInfo = {
  ok: boolean;
  org_name?: string;
  policy_text?: string | null;
  data_controller?: string | null;
};

// Página pública de la política de tratamiento, enlazada desde el checkbox
// de autorización en /join/{token} — así el titular puede leerla ANTES de
// aceptar, sin depender de que el comercio haya configurado una URL externa.
export default async function JoinPrivacidad({
  params,
}: PageProps<"/join/[token]/privacidad">) {
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

  const orgName = info.org_name ?? "el comercio";
  const text = info.policy_text?.trim() || defaultPolicyText(orgName);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-white px-5 pb-10 pt-6">
      <Link
        href={`/join/${token}`}
        aria-label="Volver"
        className="-ml-1.5 flex size-9 items-center justify-center rounded-full text-ink hover:bg-neutral-100"
      >
        <IconBack className="size-5" />
      </Link>
      <h1 className="mt-3 text-xl font-semibold text-ink">
        Política de tratamiento de datos
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {orgName} y PineappleLoyalty como su encargado técnico.
      </p>
      <pre className="mt-5 whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink">
        {text}
      </pre>
    </main>
  );
}
