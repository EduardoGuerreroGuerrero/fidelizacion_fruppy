import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findDuplicates, setMarketingConsent, updateCustomer } from "@/lib/customers/actions";
import { issueCard, redeemReward, revokeCard, rotateCardToken } from "@/lib/loyalty/actions";
import { syncWalletFormAction } from "@/lib/wallet/sync";

export const instant = false;

type TimelineItem = {
  at: string;
  kind: "visit" | "earn" | "redeem" | "adjustment" | "expire" | "reversal" | "redemption";
  text: string;
};

const TX_LABEL: Record<string, string> = {
  earn: "Acumulación",
  redeem: "Canje",
  adjustment: "Ajuste",
  expire: "Expiración",
  reversal: "Reverso",
};

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string; id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { org: slug, id } = await params;
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

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!customer) notFound();

  // Cuentas del cliente (saldo proyectado — la verdad está en el ledger).
  const { data: accounts } = await supabase
    .from("loyalty_accounts")
    .select("id, program_id, current_points, current_stamps, loyalty_programs(name, program_type)")
    .eq("customer_id", customer.id)
    .eq("organization_id", org.id);
  const accountIds = (accounts ?? []).map((a) => a.id);

  // Historial cronológico: visitas + movimientos del ledger + redenciones.
  const [{ data: visits }, { data: txs }, { data: redemptions }] = await Promise.all([
    supabase
      .from("customer_visits")
      .select("id, created_at, purchase_amount_minor, source")
      .eq("customer_id", customer.id)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(50),
    accountIds.length
      ? supabase
          .from("loyalty_transactions")
          .select("id, created_at, transaction_type, points_delta, stamps_delta, reason")
          .in("account_id", accountIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    supabase
      .from("redemptions")
      .select("id, created_at, status, rewards(name)")
      .eq("customer_id", customer.id)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const timeline: TimelineItem[] = [
    ...(visits ?? []).map((v) => ({
      at: v.created_at,
      kind: "visit" as const,
      text:
        `Visita (${v.source})` +
        (v.purchase_amount_minor ? ` — compra ${(v.purchase_amount_minor / 100).toFixed(2)}` : ""),
    })),
    ...(txs ?? []).map((t) => ({
      at: t.created_at,
      kind: t.transaction_type as TimelineItem["kind"],
      text:
        `${TX_LABEL[t.transaction_type] ?? t.transaction_type}: ` +
        [
          t.points_delta ? `${t.points_delta > 0 ? "+" : ""}${t.points_delta} pts` : null,
          t.stamps_delta ? `${t.stamps_delta > 0 ? "+" : ""}${t.stamps_delta} sellos` : null,
        ]
          .filter(Boolean)
          .join(", ") +
        (t.reason ? ` — ${t.reason}` : ""),
    })),
    ...(redemptions ?? []).map((r) => {
      const rw = Array.isArray(r.rewards) ? r.rewards[0] : r.rewards;
      return {
        at: r.created_at,
        kind: "redemption" as const,
        text: `Recompensa: ${rw?.name ?? "?"} (${r.status})`,
      };
    }),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  // Programas activos, tarjetas emitidas y recompensas canjeables.
  const [{ data: programs }, { data: cards }, { data: rewards }] = await Promise.all([
    supabase
      .from("loyalty_programs")
      .select("id, name, program_type")
      .eq("organization_id", org.id)
      .eq("status", "active"),
    supabase
      .from("customer_cards")
      .select("id, token, status, account_id")
      .eq("customer_id", customer.id)
      .eq("organization_id", org.id),
    supabase
      .from("rewards")
      .select("id, name, program_id, cost_points, cost_stamps")
      .eq("organization_id", org.id)
      .eq("status", "active"),
  ]);
  const cardByAccount = new Map((cards ?? []).map((c) => [c.account_id, c]));

  // Aviso de duplicados (mismo teléfono/email en la org — sin fusión auto).
  const duplicates = await findDuplicates(slug, customer.phone, customer.email, customer.id);

  const editAction = updateCustomer.bind(null, slug, customer.id);
  const consentOn = setMarketingConsent.bind(null, slug, customer.id, true);
  const consentOff = setMarketingConsent.bind(null, slug, customer.id, false);

  const input =
    "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";
  const label = "mb-1 block text-sm font-medium";

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-neutral-500">
        <Link href={`/dashboard/${slug}/customers`} className="hover:underline">
          Clientes
        </Link>{" "}
        / {customer.first_name} {customer.last_name ?? ""}
      </p>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">
        {customer.first_name} {customer.last_name ?? ""}
      </h1>

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
      {duplicates.length > 0 && (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
          Posible duplicado con{" "}
          {duplicates.map((d, i) => (
            <span key={d.id}>
              {i > 0 && ", "}
              <Link href={`/dashboard/${slug}/customers/${d.id}`} className="font-medium underline">
                {d.first_name} {d.last_name ?? ""}
              </Link>
            </span>
          ))}
          . No se fusionan automáticamente — revisa y decide.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-medium">Datos</h2>
          <form action={editAction} className="space-y-3">
            <div>
              <label htmlFor="first_name" className={label}>
                Nombre *
              </label>
              <input
                id="first_name"
                name="first_name"
                required
                defaultValue={customer.first_name}
                className={input}
              />
            </div>
            <div>
              <label htmlFor="last_name" className={label}>
                Apellido
              </label>
              <input
                id="last_name"
                name="last_name"
                defaultValue={customer.last_name ?? ""}
                className={input}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={label}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={customer.email ?? ""}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="phone" className={label}>
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={customer.phone ?? ""}
                  className={input}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="birth_date" className={label}>
                  Nacimiento
                </label>
                <input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={customer.birth_date ?? ""}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="external_ref" className={label}>
                  Ref. externa
                </label>
                <input
                  id="external_ref"
                  name="external_ref"
                  defaultValue={customer.external_ref ?? ""}
                  className={input}
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              Guardar cambios
            </button>
          </form>

          <h2 className="mb-3 mt-8 text-lg font-medium">Tarjetas</h2>
          <ul className="mb-8 space-y-2">
            {(programs ?? []).map((p) => {
              const account = (accounts ?? []).find(
                (a) => (a as { program_id?: string }).program_id === p.id,
              );
              const card = account ? cardByAccount.get(account.id) : undefined;
              return (
                <li
                  key={p.id}
                  className="rounded-md border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    {card ? (
                      <div className="flex items-center gap-2">
                        {card.status === "active" ? (
                          <Link
                            href={`/t/${card.token}`}
                            target="_blank"
                            className="rounded bg-green-100 px-2 py-1 text-xs text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
                          >
                            Ver tarjeta
                          </Link>
                        ) : (
                          <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900/40 dark:text-red-300">
                            revocada
                          </span>
                        )}
                        <form action={rotateCardToken.bind(null, slug, customer.id, card.id)}>
                          <button
                            type="submit"
                            className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            Rotar QR
                          </button>
                        </form>
                        {card.status === "active" && (
                          <>
                            <form action={syncWalletFormAction.bind(null, slug, customer.id)}>
                              <button
                                type="submit"
                                className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                              >
                                Wallet
                              </button>
                            </form>
                            <form action={revokeCard.bind(null, slug, customer.id, card.id)}>
                              <button
                                type="submit"
                                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                              >
                                Revocar
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    ) : (
                      <form action={issueCard.bind(null, slug, customer.id, p.id)}>
                        <button
                          type="submit"
                          className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                          Emitir tarjeta
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
            {(programs ?? []).length === 0 && (
              <li className="text-sm text-neutral-500">
                Sin programas activos — crea uno en Programas.
              </li>
            )}
          </ul>

          <h2 className="mb-3 mt-8 text-lg font-medium">Consentimiento</h2>
          <form
            action={customer.marketing_consent_at ? consentOff : consentOn}
            className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800"
          >
            <div className="text-sm">
              {customer.marketing_consent_at ? (
                <>
                  <span className="font-medium text-green-700 dark:text-green-400">Aceptado</span>{" "}
                  <span className="text-neutral-500">
                    el {new Date(customer.marketing_consent_at).toLocaleString("es-CO")}
                  </span>
                </>
              ) : (
                <span className="text-neutral-500">Sin consentimiento</span>
              )}
            </div>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {customer.marketing_consent_at ? "Revocar" : "Registrar"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium">Saldos</h2>
          {accounts && accounts.length > 0 ? (
            <ul className="mb-6 space-y-2">
              {accounts.map((a) => {
                const p = Array.isArray(a.loyalty_programs)
                  ? a.loyalty_programs[0]
                  : a.loyalty_programs;
                const programRewards = (rewards ?? []).filter(
                  (r) => r.program_id === a.program_id,
                );
                // Una clave de idempotencia por render: el mismo click/reintento
                // no cobra dos veces, pero un nuevo render permite otro canje.
                const idem = crypto.randomUUID();
                return (
                  <li
                    key={a.id}
                    className="rounded-md border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
                  >
                    <span className="font-medium">{p?.name}</span>
                    <span className="float-right">
                      {p?.program_type === "stamps"
                        ? `${a.current_stamps} sellos`
                        : `${a.current_points} pts`}
                    </span>
                    {programRewards.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                        {programRewards.map((r) => {
                          const cost =
                            r.cost_stamps !== null
                              ? `${r.cost_stamps} sellos`
                              : `${r.cost_points} pts`;
                          const affordable =
                            r.cost_stamps !== null
                              ? a.current_stamps >= r.cost_stamps
                              : a.current_points >= (r.cost_points ?? 0);
                          return (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {r.name} — {cost}
                              </span>
                              <form
                                action={redeemReward.bind(null, slug, customer.id, r.id)}
                              >
                                <input type="hidden" name="idem" value={idem} />
                                <button
                                  type="submit"
                                  disabled={!affordable}
                                  className="rounded bg-green-700 px-2 py-1 text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
                                >
                                  Canjear
                                </button>
                              </form>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mb-6 text-sm text-neutral-500">Sin cuentas de fidelización todavía.</p>
          )}

          <h2 className="mb-3 text-lg font-medium">Historial</h2>
          {timeline.length > 0 ? (
            <ul className="space-y-2">
              {timeline.slice(0, 30).map((item, i) => (
                <li
                  key={i}
                  className="rounded-md border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
                >
                  <span className="text-neutral-500">
                    {new Date(item.at).toLocaleString("es-CO")}
                  </span>
                  <span className="ml-2">{item.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Sin actividad registrada todavía.</p>
          )}
        </section>
      </div>
    </div>
  );
}
