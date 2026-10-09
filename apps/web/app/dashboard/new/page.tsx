import { createOrganization } from "@/lib/organizations/actions";

export const instant = false;

export default async function NewOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Nueva organización</h1>
      {error ? (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}
      <form action={createOrganization} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nombre del comercio
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Slug (URL interna, opcional)
          <input
            name="slug"
            pattern="[a-z0-9][a-z0-9-]{1,62}"
            placeholder="mi-comercio"
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Crear organización
        </button>
      </form>
    </div>
  );
}
