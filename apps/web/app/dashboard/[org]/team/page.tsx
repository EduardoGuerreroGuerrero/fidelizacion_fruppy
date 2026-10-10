import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cancelInvite, inviteMember, setMemberRole, setMemberStatus } from "@/lib/admin/actions";

export const instant = false;

const ROLES = ["owner", "admin", "manager", "staff"] as const;
const input =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

export default async function TeamPage({
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
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, user_id, role, status, created_at")
      .eq("organization_id", org.id)
      .order("created_at"),
    supabase
      .from("organization_invites")
      .select("id, email, role, status, created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Equipo</h1>

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

      <section className="mb-8 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-1 font-medium">Invitar por email</h2>
        <p className="mb-3 text-xs text-neutral-500">
          La invitación se activa automáticamente cuando esa persona inicia sesión con el email
          indicado.
        </p>
        <form action={inviteMember.bind(null, slug)} className="flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="email@ejemplo.com"
            className={input + " flex-1"}
          />
          <select name="role" className={input} defaultValue="staff">
            <option value="staff">staff</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Invitar
          </button>
        </form>
      </section>

      <h2 className="mb-3 text-lg font-medium">Miembros</h2>
      <ul className="mb-8 space-y-2">
        {(members ?? []).map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
          >
            <div>
              <p className="font-mono text-xs text-neutral-500">{m.user_id}</p>
              <p className="text-xs text-neutral-400">
                {m.user_id === user.id ? "(tú) · " : ""}
                desde {new Date(m.created_at).toLocaleDateString("es-CO")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form
                action={setMemberRole.bind(null, slug, m.id)}
                className="flex items-center gap-1"
              >
                <select
                  name="role"
                  defaultValue={m.role}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-transparent"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  OK
                </button>
              </form>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  m.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                }`}
              >
                {m.status}
              </span>
              {m.user_id !== user.id && (
                <form
                  action={setMemberStatus.bind(
                    null,
                    slug,
                    m.id,
                    m.status === "active" ? "suspended" : "active",
                  )}
                >
                  <button
                    type="submit"
                    className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    {m.status === "active" ? "Suspender" : "Reactivar"}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 text-lg font-medium">Invitaciones</h2>
      <ul className="space-y-2">
        {(invites ?? []).map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
          >
            <div>
              <p className="font-medium">{i.email}</p>
              <p className="text-xs text-neutral-500">
                {i.role} · {i.status}
              </p>
            </div>
            {i.status === "pending" && (
              <form action={cancelInvite.bind(null, slug, i.id)}>
                <button
                  type="submit"
                  className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
              </form>
            )}
          </li>
        ))}
        {(invites ?? []).length === 0 && (
          <li className="text-sm text-neutral-500">Sin invitaciones.</li>
        )}
      </ul>
    </div>
  );
}
