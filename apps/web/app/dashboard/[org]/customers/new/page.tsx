import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "@/lib/customers/actions";

export const instant = false;

export default async function NewCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ error?: string; warn?: string }>;
}) {
  const { org: slug } = await params;
  const { error, warn } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const action = createCustomer.bind(null, slug);

  const input =
    "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";
  const label = "mb-1 block text-sm font-medium";

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-neutral-500">
        <Link href={`/dashboard/${slug}/customers`} className="hover:underline">
          Clientes
        </Link>{" "}
        / Nuevo
      </p>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">Nuevo cliente</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {warn && (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
          {warn}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="first_name" className={label}>
            Nombre *
          </label>
          <input id="first_name" name="first_name" required className={input} />
        </div>
        <div>
          <label htmlFor="last_name" className={label}>
            Apellido
          </label>
          <input id="last_name" name="last_name" className={input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={label}>
              Email
            </label>
            <input id="email" name="email" type="email" className={input} />
          </div>
          <div>
            <label htmlFor="phone" className={label}>
              Teléfono
            </label>
            <input id="phone" name="phone" type="tel" className={input} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="birth_date" className={label}>
              Fecha de nacimiento
            </label>
            <input id="birth_date" name="birth_date" type="date" className={input} />
          </div>
          <div>
            <label htmlFor="external_ref" className={label}>
              Ref. externa
            </label>
            <input
              id="external_ref"
              name="external_ref"
              className={input}
              placeholder="ID en otro sistema"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="marketing_consent" className="mt-0.5" />
          <span>
            El cliente acepta recibir comunicaciones de marketing (consentimiento registrado con
            fecha y hora).
          </span>
        </label>

        {warn && (
          <label className="flex items-start gap-2 text-sm font-medium text-amber-900 dark:text-amber-300">
            <input type="checkbox" name="confirm_duplicate" className="mt-0.5" />
            <span>Crear de todas formas (revisé los duplicados)</span>
          </label>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
          >
            Crear cliente
          </button>
          <Link
            href={`/dashboard/${slug}/customers`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
