import { createOrganization } from "@/lib/organizations/actions";
import { createClient } from "@/lib/supabase/server";
import {
  IconPlus,
  IconStore,
  IconUpload,
} from "@/app/t/[token]/_components/icons";
import { SubmitButton } from "@/app/_components/submit-button";

export const instant = false;

export default async function NewOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string }>;
}) {
  const { error, name } = await searchParams;

  // El signup pide el nombre del negocio: se aprovecha como valor inicial.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const business = String(
    (user?.user_metadata as Record<string, unknown> | undefined)?.business ?? "",
  ).trim();
  const initialName = (name ?? business).slice(0, 120);

  return (
    <div className="relative mx-auto max-w-md">
      {/* Isotipos PineappleLoyalty decorativos */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pineapple/isotipo.png"
        alt=""
        aria-hidden
        className="pointer-events-none fixed -top-20 -right-24 w-72 rotate-12 select-none opacity-[0.07]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pineapple/isotipo.png"
        alt=""
        aria-hidden
        className="pointer-events-none fixed -bottom-28 -left-28 w-[440px] select-none opacity-[0.07]"
      />

      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Nueva organización
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Crea una nueva organización para gestionar tu programa de fidelización.
      </p>

      {error ? (
        <p className="mt-6 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <form
        action={createOrganization}
        className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/[0.04]"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pastel-mint text-brand-dark">
            <IconStore className="size-5" />
          </span>
          <label htmlFor="name" className="font-semibold text-ink">
            Nombre del comercio
          </label>
        </div>
        <input
          id="name"
          name="name"
          defaultValue={initialName}
          required
          minLength={2}
          maxLength={120}
          placeholder="Ej. Tu Negocio"
          className="mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-pl-green focus:ring-2 focus:ring-pl-green/30"
        />

        <div className="mt-6 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pastel-mint text-brand-dark">
            <IconUpload className="size-5" />
          </span>
          <label htmlFor="logo" className="font-semibold text-ink">
            Logo (PNG sin fondo, opcional)
          </label>
        </div>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png"
          className="mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-pl-cream file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-pl-green"
        />
        <p className="mt-2 text-xs text-ink-soft">
          Debe ser PNG sin fondo — es el logo que se mostrará en el panel de
          organizaciones.
        </p>

        <SubmitButton
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-pl-green-2 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pl-green">
          <IconPlus className="size-4" />
          Crear organización
        </SubmitButton>
      </form>
    </div>
  );
}
