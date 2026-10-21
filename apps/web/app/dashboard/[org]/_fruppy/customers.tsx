import Link from "next/link";
import {
  IconCalendar,
  IconChevron,
  IconChevronDown,
  IconClock,
  IconDotsV,
  IconDownload,
  IconExternal,
  IconGift,
  IconMail,
  IconPencil,
  IconPhone,
  IconPlus,
  IconQr,
  IconScan,
  IconSearch,
  IconShield,
  IconStar,
  IconTag,
  IconUser,
  IconX,
} from "@/app/t/[token]/_components/icons";
import { displayName } from "@/lib/format";
import { archiveCustomer } from "@/lib/customers/actions";
import { Avatar, Card, Chip, IconTile } from "./ui";
import { timeAgo } from "./config";
import { ImportCsvButton } from "./import-csv";

// Menú de acciones por cliente (ficha, QR, eliminar). <details>/<summary>
// nativo: no requiere JS de cliente y funciona igual en la fila de escritorio
// y en la tarjeta móvil — antes el botón de 3 puntos solo enlazaba al panel
// lateral rápido, que en móvil queda fuera de vista y parecía "no hacer nada".
function RowMenu({
  slug,
  customerId,
  name,
}: {
  slug: string;
  customerId: string;
  name: string;
}) {
  const base = `/dashboard/${slug}/customers`;
  return (
    <details className="group/menu relative">
      <summary
        aria-label={`Más acciones para ${name}`}
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-ink-soft transition hover:bg-neutral-100 hover:text-navy [&::-webkit-details-marker]:hidden"
      >
        <IconDotsV className="size-4" />
      </summary>
      <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5">
        <Link
          href={`${base}/${customerId}`}
          className="block px-4 py-2 text-left text-sm text-navy hover:bg-neutral-50"
        >
          Ver ficha
        </Link>
        <Link
          href={`${base}/${customerId}#tarjetas`}
          className="block px-4 py-2 text-left text-sm text-navy hover:bg-neutral-50"
        >
          Ver QR de tarjeta
        </Link>
        <form action={archiveCustomer.bind(null, slug, customerId)}>
          <button
            type="submit"
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Eliminar cliente
          </button>
        </form>
      </div>
    </details>
  );
}

export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  marketing: boolean;
  programName: string | null;
  programType: string | null;
  stamps: number;
  stampGoal: number | null;
  points: number;
  lastVisitAt: string | null;
};

export type PanelData = {
  customer: CustomerRow;
  totalVisits: number;
  totalRedemptions: number;
  recent: { id: string; at: string; label: string }[];
} | null;

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white py-2.5 text-sm text-navy outline-none transition focus:border-brand";
const iconBtn =
  "flex size-9 items-center justify-center rounded-xl bg-pastel-sky/70 text-[#2a6fae] transition hover:bg-pastel-sky";

function pager(base: string, page: number, q: string, status: string, program: string) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (status) p.set("status", status);
  if (program) p.set("program", program);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return `${base}${s ? `?${s}` : ""}`;
}

export function FruppyCustomers({
  slug,
  customers,
  programs,
  total,
  page,
  pageSize,
  q,
  status,
  program,
  panel,
}: {
  slug: string;
  customers: CustomerRow[];
  programs: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  status: string;
  program: string;
  panel: PanelData;
}) {
  const base = `/dashboard/${slug}`;
  const customersBase = `${base}/customers`;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const panelUrl = (id: string, tab = "resumen") => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (program) p.set("program", program);
    if (page > 1) p.set("page", String(page));
    p.set("panel", id);
    if (tab !== "resumen") p.set("tab", tab);
    return `${customersBase}?${p}`;
  };
  const closeUrl = (() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (program) p.set("program", program);
    if (page > 1) p.set("page", String(page));
    const s = p.toString();
    return `${customersBase}${s ? `?${s}` : ""}`;
  })();

  return (
    <div className={`grid grid-cols-1 items-start gap-5 [&>*]:min-w-0 ${panel ? "lg:grid-cols-[1fr_320px]" : ""}`}>
      <div>
        {/* ===== Barra de acciones ===== */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`${customersBase}/new`}
            className="flex items-center gap-1.5 rounded-full bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper"
          >
            <IconPlus className="size-4" />
            Nuevo cliente
          </Link>
          <a
            href={`${customersBase}/export`}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-neutral-50"
          >
            <IconDownload className="size-4" />
            Exportar CSV
          </a>
          <span className="lg:ml-auto">
            <ImportCsvButton slug={slug} />
          </span>
        </div>

        {/* ===== Buscador y filtros ===== */}
        <form action="" className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-52 flex-1">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, email o teléfono..."
              className={`${inputCls} pl-10 pr-4`}
            />
          </div>
          <div className="relative">
            <select
              name="status"
              defaultValue={status}
              className={`${inputCls} appearance-none py-2.5 pl-4 pr-9 font-medium`}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          </div>
          <div className="relative">
            <select
              name="program"
              defaultValue={program}
              className={`${inputCls} appearance-none py-2.5 pl-4 pr-9 font-medium`}
            >
              <option value="">Todos los programas</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/15"
          >
            <IconSearch className="size-4" />
            Buscar
          </button>
        </form>

        <p className="mt-3 text-sm font-medium text-ink-soft lg:hidden">
          {total} cliente{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}
        </p>

        {/* ===== Tabla (lg+) ===== */}
        <Card className="mt-4 hidden overflow-hidden lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-medium text-ink-soft">
                <th className="w-10 px-4 py-3.5">
                  <input type="checkbox" aria-label="Seleccionar todos" className="accent-[#17b8a6]" />
                </th>
                <th className="px-2 py-3.5">Cliente</th>
                <th className="px-2 py-3.5">Contacto</th>
                <th className="px-2 py-3.5">Programa</th>
                <th className="px-2 py-3.5">Estado</th>
                <th className="px-2 py-3.5">Sellos / Meta</th>
                <th className="px-2 py-3.5">Última visita</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {customers.map((c, i) => (
                <tr key={c.id} className="transition hover:bg-[#fdf8fb]">
                  <td className="px-4 py-3">
                    <input type="checkbox" aria-label={`Seleccionar a ${c.name}`} className="accent-[#17b8a6]" />
                  </td>
                  <td className="px-2 py-3">
                    <Link href={panelUrl(c.id)} className="flex items-center gap-3">
                      <Avatar name={c.name} index={i} />
                      <span className="font-semibold text-navy">{displayName(c.name)}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-3">
                    <p className="truncate text-xs text-ink-soft">{c.email ?? "—"}</p>
                    {c.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                        <IconPhone className="size-3" />
                        {c.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    {c.programName ? (
                      <Chip tone={c.programType === "points" ? "lav" : "pink"}>
                        {c.programName}
                      </Chip>
                    ) : (
                      <span className="text-xs text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <Chip tone={c.status === "active" ? "green" : "gray"}>
                      {c.status === "active" ? "Activo" : "Inactivo"}
                    </Chip>
                  </td>
                  <td className="px-2 py-3">
                    {c.programType === "points" ? (
                      <span className="font-semibold text-navy">{c.points} pts</span>
                    ) : c.stampGoal ? (
                      <span className="block">
                        <span className="text-xs font-semibold tabular-nums text-navy">
                          {c.stamps} / {c.stampGoal}
                        </span>
                        <span className="mt-1 block h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                          <span
                            className="block h-full rounded-full bg-accent"
                            style={{
                              width: `${Math.min(100, (c.stamps / c.stampGoal) * 100)}%`,
                            }}
                          />
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-ink-soft">
                    {c.lastVisitAt ? timeAgo(c.lastVisitAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`${customersBase}/${c.id}`}
                        aria-label="Abrir cliente"
                        className={iconBtn}
                      >
                        <IconExternal className="size-4" />
                      </Link>
                      <Link
                        href={panelUrl(c.id)}
                        aria-label="Panel rápido"
                        className="rounded-lg p-1.5 text-ink-soft transition hover:bg-neutral-100 hover:text-navy"
                      >
                        <IconChevron className="size-4" />
                      </Link>
                      <RowMenu slug={slug} customerId={c.id} name={c.name} />
                    </span>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-soft">
                    {q ? "Sin resultados para esa búsqueda." : "Aún no hay clientes. Registra el primero."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm">
            <p className="text-xs text-ink-soft">
              Mostrando {from} a {to} de {total} clientes
            </p>
            <nav className="flex items-center gap-1" aria-label="Paginación">
              <Link
                href={pager(customersBase, Math.max(1, page - 1), q, status, program)}
                aria-disabled={page <= 1}
                className={`flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                  page <= 1 ? "pointer-events-none text-neutral-300" : "text-navy hover:bg-neutral-100"
                }`}
              >
                ‹
              </Link>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pager(customersBase, n, q, status, program)}
                  className={`flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                    n === page ? "bg-brand-dark text-white" : "text-navy hover:bg-neutral-100"
                  }`}
                >
                  {n}
                </Link>
              ))}
              {pages > 5 && <span className="px-1 text-ink-soft">…</span>}
              <Link
                href={pager(customersBase, Math.min(pages, page + 1), q, status, program)}
                aria-disabled={page >= pages}
                className={`flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                  page >= pages ? "pointer-events-none text-neutral-300" : "text-navy hover:bg-neutral-100"
                }`}
              >
                ›
              </Link>
            </nav>
          </div>
        </Card>

        {/* ===== Tarjetas (móvil) ===== */}
        <ul className="mt-3 space-y-3 lg:hidden">
          {customers.map((c, i) => (
            <li key={c.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
              <div className="flex items-start gap-3">
                <Avatar name={c.name} index={i} size="size-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold text-navy">{displayName(c.name)}</p>
                    <Link href={panelUrl(c.id)} aria-label="Ver detalle" className="p-1 text-ink-soft">
                      <IconChevron className="size-5" />
                    </Link>
                  </div>
                  {c.email && <p className="mt-0.5 truncate text-xs text-ink-soft">{c.email}</p>}
                  {c.phone && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
                      <IconPhone className="size-3.5" />
                      {c.phone}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {c.marketing && <Chip tone="green">marketing</Chip>}
                    <Chip tone={c.status === "active" ? "teal" : "gray"}>
                      {c.status === "active" ? "activo" : "inactivo"}
                    </Chip>
                    {c.programName && (
                      <Chip tone={c.programType === "points" ? "lav" : "pink"}>
                        {c.programName}
                      </Chip>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <Link
                    href={`${customersBase}/${c.id}#tarjetas`}
                    aria-label="Ver tarjeta / QR"
                    className={iconBtn}
                  >
                    <IconQr className="size-4" />
                  </Link>
                  <RowMenu slug={slug} customerId={c.id} name={c.name} />
                </div>
              </div>
            </li>
          ))}
          {customers.length === 0 && (
            <li className="rounded-3xl border border-dashed border-neutral-200 p-8 text-center text-sm text-ink-soft">
              {q ? "Sin resultados para esa búsqueda." : "Aún no hay clientes. Registra el primero."}
            </li>
          )}
        </ul>

        {/* Paginación móvil */}
        {pages > 1 && (
          <nav className="mt-4 flex items-center justify-center gap-1 lg:hidden" aria-label="Paginación">
            <Link
              href={pager(customersBase, Math.max(1, page - 1), q, status, program)}
              className={`flex size-9 items-center justify-center rounded-xl font-semibold ${
                page <= 1 ? "pointer-events-none text-neutral-300" : "bg-white text-navy"
              }`}
            >
              ‹
            </Link>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pager(customersBase, n, q, status, program)}
                className={`flex size-9 items-center justify-center rounded-xl text-sm font-semibold ${
                  n === page ? "bg-brand-dark text-white" : "bg-white text-navy"
                }`}
              >
                {n}
              </Link>
            ))}
            <Link
              href={pager(customersBase, Math.min(pages, page + 1), q, status, program)}
              className={`flex size-9 items-center justify-center rounded-xl font-semibold ${
                page >= pages ? "pointer-events-none text-neutral-300" : "bg-white text-navy"
              }`}
            >
              ›
            </Link>
          </nav>
        )}
      </div>

      {/* ===== Panel lateral de cliente ===== */}
      {panel && <CustomerPanel slug={slug} data={panel} closeUrl={closeUrl} />}
    </div>
  );
}

function CustomerPanel({
  slug,
  data,
  closeUrl,
}: {
  slug: string;
  data: NonNullable<PanelData>;
  closeUrl: string;
}) {
  const { customer: c, totalVisits, totalRedemptions, recent } = data;
  const base = `/dashboard/${slug}`;
  const stats = [
    { icon: IconCalendar, tone: "pink" as const, value: String(totalVisits), label: "Visitas totales" },
    {
      icon: IconStar,
      tone: "lav" as const,
      value: c.programType === "points" ? `${c.points}` : `${c.stamps}`,
      label: c.programType === "points" ? "Puntos actuales" : "Sellos actuales",
    },
    { icon: IconGift, tone: "peach" as const, value: String(totalRedemptions), label: "Canjes realizados" },
    {
      icon: IconClock,
      tone: "sky" as const,
      value: c.lastVisitAt ? timeAgo(c.lastVisitAt) : "—",
      label: "Última visita",
    },
  ];

  return (
    <Card className="p-5 lg:sticky lg:top-28">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size="size-12" textSize="text-sm" />
          <div>
            <p className="font-bold text-navy">{displayName(c.name)}</p>
            <Chip tone={c.status === "active" ? "green" : "gray"} className="mt-1">
              {c.status === "active" ? "Activo" : "Inactivo"}
            </Chip>
          </div>
        </div>
        <Link
          href={closeUrl}
          aria-label="Cerrar panel"
          className="flex size-8 items-center justify-center rounded-full text-ink-soft transition hover:bg-neutral-100"
        >
          <IconX className="size-4" />
        </Link>
      </div>

      {c.email && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
          <IconMail className="size-4 shrink-0" />
          <span className="truncate">{c.email}</span>
        </p>
      )}
      {c.phone && (
        <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-soft">
          <IconPhone className="size-4 shrink-0" />
          {c.phone}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`${base}/customers/${c.id}`}
          className="flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-navy transition hover:bg-neutral-50"
        >
          <IconPencil className="size-3.5" />
          Editar
        </Link>
        <Link
          href={`${base}/scan`}
          className="flex items-center justify-center gap-1.5 rounded-full bg-brand-dark px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-deeper"
        >
          <IconScan className="size-3.5" />
          Registrar visita
        </Link>
      </div>

      {c.programName && (
        <div className="mt-4 rounded-2xl bg-pastel-pink/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IconTile tone="pink" size="size-8">
                <IconGift className="size-4" />
              </IconTile>
              <span className="text-sm font-bold text-navy">{c.programName}</span>
            </span>
            <IconChevron className="size-4 text-ink-soft" />
          </div>
          {c.programType === "stamps" && c.stampGoal ? (
            <>
              <p className="mt-2 text-xs text-ink-soft">
                {c.stamps} de {c.stampGoal} sellos
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, (c.stamps / c.stampGoal) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-ink-soft">{c.points} puntos acumulados</p>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#faf6f8] p-3">
            <IconTile tone={s.tone} size="size-8">
              <s.icon className="size-4" />
            </IconTile>
            <p className="mt-2 text-sm font-bold text-navy">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <h4 className="mt-5 text-sm font-bold text-navy">Información del cliente</h4>
      <dl className="mt-2 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-ink-soft">
            <IconUser className="size-4" /> Nombre
          </dt>
          <dd className="font-medium text-navy">{displayName(c.name)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-ink-soft">
            <IconMail className="size-4" /> Email
          </dt>
          <dd className="max-w-[60%] truncate font-medium text-navy">{c.email ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-ink-soft">
            <IconPhone className="size-4" /> Teléfono
          </dt>
          <dd className="font-medium text-navy">{c.phone ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-ink-soft">
            <IconShield className="size-4" /> Estado
          </dt>
          <dd className="font-medium text-navy">{c.status === "active" ? "Activo" : "Inactivo"}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-ink-soft">
            <IconTag className="size-4" /> Etiquetas
          </dt>
          <dd>{c.marketing ? <Chip tone="green">marketing</Chip> : <span className="text-ink-soft">—</span>}</dd>
        </div>
      </dl>

      {recent.length > 0 && (
        <>
          <h4 className="mt-5 text-sm font-bold text-navy">Últimos movimientos</h4>
          <ul className="mt-2 space-y-1.5">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-ink-soft">{r.label}</span>
                <span className="font-medium text-navy">{timeAgo(r.at)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
