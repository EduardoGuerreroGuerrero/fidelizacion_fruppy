import {
  IconArchive,
  IconAward,
  IconBulb,
  IconCheckCircle,
  IconCoins,
  IconGift,
  IconGrid,
  IconPencil,
  IconPlusCircle,
  IconStamp,
  IconStar,
  IconTarget,
  IconTrendUp,
  IconUsers,
} from "@/app/t/[token]/_components/icons";
import { saveProgram, setProgramStatus } from "@/lib/admin/actions";
import { Card, Chip, IconTile } from "./ui";
import { SubmitButton } from "@/app/_components/submit-button";

export type ProgramRow = {
  id: string;
  name: string;
  program_type: string;
  stamp_goal: number | null;
  points_per_currency_unit: number | null;
  status: string;
  participants: number;
};

const input =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand";
const label = "mb-1.5 block text-xs font-semibold text-navy";

export function FruppyPrograms({
  slug,
  programs,
  totalParticipants,
  rewardsCount,
  error,
  ok,
}: {
  slug: string;
  programs: ProgramRow[];
  totalParticipants: number;
  rewardsCount: number;
  error?: string;
  ok?: string;
}) {
  const active = programs.filter((p) => p.status === "active").length;
  const stampsCount = programs.filter((p) => p.program_type === "stamps").length;
  const pointsCount = programs.filter((p) => p.program_type === "points").length;

  const kpis = [
    { icon: IconGrid, tone: "lav" as const, value: String(programs.length), label: "Programas totales" },
    { icon: IconCheckCircle, tone: "mint" as const, value: String(active), label: "Activos" },
    { icon: IconUsers, tone: "pink" as const, value: String(totalParticipants), label: "Participantes" },
    { icon: IconGift, tone: "peach" as const, value: String(rewardsCount), label: "Recompensas" },
  ];

  const types = [
    {
      icon: IconStamp,
      tone: "pink" as const,
      name: "Sellos",
      text: "El cliente acumula un sello por visita o compra. Al llegar a la meta, gana la recompensa.",
    },
    {
      icon: IconCoins,
      tone: "peach" as const,
      name: "Puntos",
      text: "Cada compra suma puntos según el valor gastado. Los puntos se canjean por recompensas.",
    },
    {
      icon: IconTrendUp,
      tone: "sky" as const,
      name: "Cashback",
      text: "Devuelve un porcentaje de cada compra como saldo para futuras visitas.",
      soon: true,
    },
    {
      icon: IconAward,
      tone: "lav" as const,
      name: "Niveles",
      text: "Los clientes suben de nivel según su actividad y desbloquean beneficios exclusivos.",
      soon: true,
    },
  ];

  const tips = [
    "Mantén la meta de sellos entre 6 y 10: metas cortas motivan más.",
    "Usa recompensas que el cliente pueda disfrutar en su próxima visita.",
    "Comunica el programa en caja: un QR visible aumenta los registros.",
    "Revisa el panel cada semana para ver qué clientes están cerca de su premio.",
  ];

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
          ✕ {error}
        </p>
      )}
      {ok && (
        <p className="mb-4 rounded-2xl bg-pastel-mint px-4 py-3 text-sm font-medium text-brand-dark">
          ✓ {ok}
        </p>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="flex items-center gap-3 p-4">
            <IconTile tone={k.tone}>
              <k.icon className="size-5" />
            </IconTile>
            <div>
              <p className="text-xl font-bold tabular-nums text-navy">{k.value}</p>
              <p className="text-xs font-medium text-ink-soft">{k.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          {/* ===== Crear nuevo programa ===== */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <IconPlusCircle className="size-5 text-brand-dark" />
              Crear nuevo programa
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Define cómo tus clientes acumulan beneficios en cada visita.
            </p>
            <form action={saveProgram.bind(null, slug)} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="p-name" className={label}>
                  Nombre del programa *
                </label>
                <input
                  id="p-name"
                  name="name"
                  required
                  placeholder="Ej: Fruppy Club"
                  className={input}
                />
              </div>

              <div className="sm:col-span-2">
                <span className={label}>Tipo de programa</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-3.5 transition has-checked:border-brand has-checked:bg-brand-soft/40">
                    <input
                      type="radio"
                      name="program_type"
                      value="stamps"
                      defaultChecked
                      className="mt-1 accent-[#17b8a6]"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                        <IconStamp className="size-4 text-accent" /> Sellos
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-soft">
                        Un sello por visita; premio al completar la meta.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-3.5 transition has-checked:border-brand has-checked:bg-brand-soft/40">
                    <input
                      type="radio"
                      name="program_type"
                      value="points"
                      className="mt-1 accent-[#17b8a6]"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                        <IconCoins className="size-4 text-[#8f5a1c]" /> Puntos
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-soft">
                        Puntos por cada unidad de moneda gastada.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="p-goal" className={label}>
                  Meta de sellos (solo Sellos)
                </label>
                <input
                  id="p-goal"
                  name="stamp_goal"
                  type="number"
                  min={1}
                  max={1000}
                  placeholder="Ej: 8"
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="p-ppcu" className={label}>
                  Puntos por $ (solo Puntos)
                </label>
                <input
                  id="p-ppcu"
                  name="points_per_currency_unit"
                  type="number"
                  step="0.0001"
                  min={0}
                  placeholder="Ej: 1"
                  className={input}
                />
              </div>

              <SubmitButton
                className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper sm:col-span-2">
                Crear programa
              </SubmitButton>
            </form>
          </Card>

          {/* ===== Lista de programas ===== */}
          <h2 className="mb-3 mt-6 font-bold text-navy">Tus programas</h2>
          <ul className="space-y-3">
            {programs.map((p) => (
              <li key={p.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <IconTile tone={p.program_type === "points" ? "peach" : "pink"}>
                      {p.program_type === "points" ? (
                        <IconCoins className="size-5" />
                      ) : (
                        <IconStamp className="size-5" />
                      )}
                    </IconTile>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 font-bold text-navy">
                        {p.name}
                        <Chip tone={p.status === "active" ? "green" : "gray"}>
                          {p.status === "active" ? "Activo" : p.status}
                        </Chip>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {p.program_type === "stamps"
                          ? `Sellos · Meta: ${p.stamp_goal} sellos`
                          : `Puntos · ${p.points_per_currency_unit} pts por unidad de moneda`}
                        {" · "}
                        {p.participants} participante{p.participants === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <form
                      action={setProgramStatus.bind(
                        null,
                        slug,
                        p.id,
                        p.status === "active" ? "archived" : "active",
                      )}
                    >
                      <SubmitButton
                        title={p.status === "active" ? "Archivar" : "Reactivar"}
                        className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-neutral-50">
                        <IconArchive className="size-3.5" />
                        {p.status === "active" ? "Archivar" : "Reactivar"}
                      </SubmitButton>
                    </form>
                  </div>
                </div>

                {/* Edición inline: se despliega sin JS. */}
                <details className="group mt-3 border-t border-neutral-100 pt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-brand-dark [&::-webkit-details-marker]:hidden">
                    <IconPencil className="size-3.5" />
                    Editar programa
                  </summary>
                  <form
                    action={saveProgram.bind(null, slug)}
                    className="mt-3 flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="program_type" value={p.program_type} />
                    <div className="min-w-40 flex-1">
                      <label className={label}>Nombre</label>
                      <input name="name" defaultValue={p.name} required className={input} />
                    </div>
                    {p.program_type === "stamps" ? (
                      <div className="w-32">
                        <label className={label}>Meta (sellos)</label>
                        <input
                          name="stamp_goal"
                          type="number"
                          min={1}
                          max={1000}
                          defaultValue={p.stamp_goal ?? 9}
                          className={input}
                        />
                      </div>
                    ) : (
                      <div className="w-36">
                        <label className={label}>Pts por $</label>
                        <input
                          name="points_per_currency_unit"
                          type="number"
                          step="0.0001"
                          min={0}
                          defaultValue={p.points_per_currency_unit ?? 1}
                          className={input}
                        />
                      </div>
                    )}
                    <SubmitButton
                      className="rounded-full bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deeper">
                      Guardar
                    </SubmitButton>
                  </form>
                </details>
              </li>
            ))}
            {programs.length === 0 && (
              <li className="rounded-3xl border border-dashed border-neutral-200 p-8 text-center text-sm text-ink-soft">
                Sin programas todavía — crea el primero arriba.
              </li>
            )}
          </ul>
        </div>

        {/* ===== Columna lateral ===== */}
        <div className="space-y-4 lg:sticky lg:top-28">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <IconGrid className="size-5 text-[#6545c4]" />
              Tipos de programa
            </h2>
            <ul className="mt-3 space-y-3">
              {types.map((t) => (
                <li key={t.name} className="flex items-start gap-3">
                  <IconTile tone={t.tone} size="size-9">
                    <t.icon className="size-4" />
                  </IconTile>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                      {t.name}
                      {t.soon && <Chip tone="gray">Pronto</Chip>}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <IconTarget className="size-5 text-brand-dark" />
              Resumen
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Programas de sellos</dt>
                <dd className="font-semibold text-navy">{stampsCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Programas de puntos</dt>
                <dd className="font-semibold text-navy">{pointsCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Participantes</dt>
                <dd className="font-semibold text-navy">{totalParticipants}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Recompensas</dt>
                <dd className="font-semibold text-navy">{rewardsCount}</dd>
              </div>
            </dl>
          </Card>

          <div className="rounded-3xl bg-pastel-pink/60 p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <IconBulb className="size-5 text-accent" />
              Consejos Fruppy
            </h2>
            <ul className="mt-3 space-y-2.5">
              {tips.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs leading-relaxed text-navy/80">
                  <IconStar className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
