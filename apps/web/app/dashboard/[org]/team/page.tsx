import { notFound, redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { cancelInvite, inviteMember, setMemberRole, setMemberStatus } from "@/lib/admin/actions";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";
import { roleLabel, statusLabel } from "@/lib/labels";

export const instant = false;

const ROLES = ["owner", "admin", "manager", "staff"] as const;
const input =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm";

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
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  type Member = {
    id: string;
    user_id: string;
    email: string | null;
    full_name: string | null;
    role: string;
    status: string;
    created_at: string;
  };

  const [{ data: directory }, { data: invites }] = await Promise.all([
    supabase.rpc("org_member_directory", { p_org_id: org.id }),
    supabase
      .from("organization_invites")
      .select("id, email, role, status, created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false }),
  ]);

  // Directorio con correo y nombre (RPC, migración 0020). Si la RPC aún no existe
  // o el rol no alcanza, se cae al listado básico sin correos.
  let members: Member[];
  if (directory) {
    members = (
      directory as {
        member_id: string;
        user_id: string;
        email: string | null;
        full_name: string | null;
        role: string;
        status: string;
        created_at: string;
      }[]
    ).map((d) => ({ ...d, id: d.member_id }));
  } else {
    const { data: basic } = await supabase
      .from("organization_members")
      .select("id, user_id, role, status, created_at")
      .eq("organization_id", org.id)
      .order("created_at");
    members = (basic ?? []).map((b) => ({ ...b, email: null, full_name: null }));
  }

  const myRole = members.find((m) => m.user_id === user.id)?.role;
  const iAmOwner = myRole === "owner";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Equipo</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          {ok}
        </p>
      )}

      <section className="mb-8 rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-1 font-medium">Invitar por email</h2>
        <p className="mb-3 text-xs text-ink-soft">
          La invitación se activa automáticamente cuando esa persona inicia sesión con el email
          indicado.
        </p>
        <RememberForm storageKey="team-invite" action={inviteMember.bind(null, slug)} className="flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="email@ejemplo.com"
            className={input + " flex-1"}
          />
          <select name="role" className={input} defaultValue="staff">
            <option value="staff">{roleLabel("staff")}</option>
            <option value="manager">{roleLabel("manager")}</option>
            <option value="admin">{roleLabel("admin")}</option>
          </select>
          <SubmitButton
            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper">
            Invitar
          </SubmitButton>
        </RememberForm>
      </section>

      <h2 className="mb-3 text-lg font-medium">Miembros</h2>
      <ul className="mb-8 space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-ink">
                {m.full_name ?? m.email ?? "Miembro del equipo"}
              </p>
              {m.full_name && m.email ? (
                <p className="text-xs text-ink-soft">{m.email}</p>
              ) : null}
              <p className="text-xs text-ink-soft">
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
                  disabled={m.role === "owner" && !iAmOwner}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs"
                >
                  {ROLES.filter((r) => r !== "owner" || iAmOwner || m.role === "owner").map(
                    (r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ),
                  )}
                </select>
                <SubmitButton
                  disabled={m.role === "owner" && !iAmOwner}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50">
                  OK
                </SubmitButton>
              </form>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  m.status ==="active"
                    ? "bg-green-100 text-green-800"
                    : "bg-neutral-100 text-ink-soft"
                }`}
              >
                {statusLabel(m.status)}
              </span>
              {m.user_id !== user.id && (m.role !== "owner" || iAmOwner) && (
                <form
                  action={setMemberStatus.bind(
                    null,
                    slug,
                    m.id,
                    m.status === "active" ? "suspended" : "active",
                  )}
                >
                  <SubmitButton
                    className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">
                    {m.status === "active" ? "Suspender" : "Reactivar"}
                  </SubmitButton>
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
            className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{i.email}</p>
              <p className="text-xs text-ink-soft">
                {roleLabel(i.role)} · {statusLabel(i.status)}
              </p>
            </div>
            {i.status === "pending" && (
              <form action={cancelInvite.bind(null, slug, i.id)}>
                <SubmitButton
                  className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
                  confirm="¿Seguro que quieres cancelar?">
                  Cancelar
                </SubmitButton>
              </form>
            )}
          </li>
        ))}
        {(invites ?? []).length === 0 && (
          <li className="text-sm text-ink-soft">Sin invitaciones.</li>
        )}
      </ul>
    </div>
  );
}
