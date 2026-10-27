"use client";

import { useState } from "react";
import { RememberForm } from "@/app/_components/remember-form";
import { SubmitButton } from "@/app/_components/submit-button";
import { CARD_DESTINATIONS } from "@/lib/push/destination";
import { renderCampaignText } from "@/lib/push/template";

// Compositor de campañas: plantillas, contadores, destino, programación con
// atajos y vista previa en vivo de cómo se verá en el navegador y en Wallet.

const field =
  "w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-pl-green-2 focus:ring-2 focus:ring-pl-green-2/30 dark:bg-transparent";

const TEMPLATES = [
  { label: "Promo del día", title: "Hoy tenemos una promo para ti", body: "Pasa por {n} y muestra tu tarjeta para aprovecharla. Solo por hoy." },
  { label: "Nuevo premio", title: "Nuevo premio disponible", body: "Ya puedes canjear un premio nuevo con tus puntos o sellos en {n}." },
  { label: "Te extrañamos", title: "¡Te extrañamos!", body: "Vuelve esta semana a {n} y suma más en tu tarjeta de fidelidad." },
  { label: "Horario especial", title: "Horario especial", body: "Este fin de semana {n} abre con horario extendido. ¡Te esperamos!" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function presetDate(kind: "1h" | "tomorrow" | "weekend"): string {
  const d = new Date();
  if (kind === "1h") d.setHours(d.getHours() + 1);
  if (kind === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  }
  if (kind === "weekend") {
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    d.setHours(10, 0, 0, 0);
  }
  return toLocalInput(d);
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={`text-[11px] tabular-nums ${value > max * 0.9 ? "text-amber-700" : "text-ink-soft"}`}>
      {value}/{max}
    </span>
  );
}

export function CampaignComposer({
  action,
  orgName,
  orgInitial,
  disabled,
  audience,
}: {
  action: (formData: FormData) => void | Promise<void>;
  orgName: string;
  orgInitial: string;
  disabled: boolean;
  audience: number;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dest, setDest] = useState<string>("card");
  const [custom, setCustom] = useState("");
  const [schedule, setSchedule] = useState("");
  const [tab, setTab] = useState<"browser" | "wallet">("browser");

  const scheduled = schedule !== "";
  // Vista previa con las variables resueltas como las verá un cliente real.
  const vars = { negocio: orgName, nombre: "Ana" };
  const pTitle = renderCampaignText(title, vars);
  const pBody = renderCampaignText(body, vars);
  const invalid = title.trim() === "" || body.trim() === "" || (dest === "custom" && !/^https:\/\//.test(custom));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <RememberForm
        storageKey="campaign-new"
        action={action}
        className="space-y-5 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm dark:bg-transparent"
      >
        <input type="hidden" name="tz" value={new Date().getTimezoneOffset()} suppressHydrationWarning />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Empieza con una plantilla</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setTitle(t.title);
                  setBody(t.body.replace("{n}", orgName));
                }}
                className="rounded-full border border-ink/10 bg-brand-soft/60 px-3 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="c-title" className="text-[13px] font-semibold">Título</label>
            <Counter value={title.length} max={100} />
          </div>
          <input
            id="c-title"
            name="title"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Hoy 2×1 en helados"
            className={field}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="c-body" className="text-[13px] font-semibold">Mensaje</label>
            <Counter value={body.length} max={300} />
          </div>
          <textarea
            id="c-body"
            name="body"
            required
            maxLength={300}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Cuéntales qué pasa y por qué vale la pena entrar hoy."
            className={field}
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
            Insertar:
            {(["{nombre}", "{negocio}"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBody((b) => `${b}${b && !b.endsWith(" ") ? " " : ""}${v}`)}
                className="rounded-full border border-ink/10 px-2 py-0.5 font-mono hover:bg-neutral-50"
              >
                {v}
              </button>
            ))}
            <span>se reemplazan por cliente al enviar</span>
          </div>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">Al tocar la notificación abre…</legend>
          <div className="flex flex-wrap gap-2">
            {[...CARD_DESTINATIONS, { value: "custom", label: "Enlace externo" }].map((d) => (
              <label
                key={d.value}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  dest === d.value
                    ? "border-brand bg-brand text-white"
                    : "border-ink/10 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="radio"
                  name="dest"
                  value={d.value}
                  checked={dest === d.value}
                  onChange={() => setDest(d.value)}
                  className="sr-only"
                />
                {d.label}
              </label>
            ))}
          </div>
          {dest === "custom" ? (
            <input
              name="url"
              type="url"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="https://"
              className={`${field} mt-2`}
            />
          ) : null}
        </fieldset>

        <div>
          <label htmlFor="c-schedule" className="mb-1.5 block text-[13px] font-semibold">
            Programar envío <span className="font-normal text-ink-soft">(opcional, tu hora local)</span>
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {(
              [
                ["1h", "En 1 hora"],
                ["tomorrow", "Mañana 9:00"],
                ["weekend", "Sábado 10:00"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSchedule(presetDate(k))}
                className="rounded-full border border-ink/10 px-3 py-1 text-xs hover:bg-neutral-50"
              >
                {label}
              </button>
            ))}
            {scheduled ? (
              <button type="button" onClick={() => setSchedule("")} className="px-2 py-1 text-xs text-ink-soft underline">
                Quitar
              </button>
            ) : null}
          </div>
          <input
            id="c-schedule"
            name="schedule"
            type="datetime-local"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className={field}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
          {scheduled ? (
            <SubmitButton
              name="intent"
              value="schedule"
              disabled={disabled || invalid}
              className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper disabled:opacity-50"
            >
              Programar campaña
            </SubmitButton>
          ) : (
            <SubmitButton
              name="intent"
              value="send"
              disabled={disabled || invalid}
              confirm={`¿Enviar ahora a ${audience} suscripción(es) y a los pases de Google Wallet? No se puede deshacer.`}
              className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper disabled:opacity-50"
            >
              Enviar ahora
            </SubmitButton>
          )}
          <SubmitButton
            name="intent"
            value="draft"
            disabled={disabled || invalid}
            className="rounded-full border border-ink/15 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            Guardar borrador
          </SubmitButton>
        </div>
      </RememberForm>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="mb-2 flex gap-1 rounded-full bg-neutral-100 p-1 text-xs font-medium">
          {(
            [
              ["browser", "Navegador"],
              ["wallet", "Google Wallet"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${tab === k ? "bg-white shadow-sm" : "text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-neutral-200/70 p-4">
          {tab === "browser" ? (
            <div className="rounded-2xl bg-white p-3 shadow">
              <div className="flex items-center gap-2 text-[11px] text-ink-soft">
                <span className="grid size-5 place-items-center rounded-md bg-brand text-[10px] font-bold text-white">
                  {orgInitial}
                </span>
                <span>{orgName} · ahora</span>
              </div>
              <p className="mt-1.5 break-words text-sm font-semibold">{pTitle || "Título de tu notificación"}</p>
              <p className="mt-0.5 break-words text-[13px] text-ink-soft">
                {pBody || "Aquí se verá el mensaje que reciben tus clientes."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-brand p-4 text-white shadow">
              <p className="text-xs opacity-80">{orgName}</p>
              <div className="mt-3 rounded-xl bg-white/12 p-3 backdrop-blur-sm" style={{ background: "rgb(255 255 255 / 0.14)" }}>
                <p className="text-[11px] uppercase tracking-wide opacity-70">Mensaje</p>
                <p className="mt-1 break-words text-sm font-semibold">{pTitle || "Título"}</p>
                <p className="mt-0.5 break-words text-[13px] opacity-90">{pBody || "Mensaje…"}</p>
              </div>
            </div>
          )}
        </div>

        <ul className="mt-3 space-y-1 text-[11px] leading-snug text-ink-soft">
          <li>
            <strong className="text-ink">{audience}</strong> suscripción(es) push elegibles. Solo reciben quienes
            activaron las notificaciones de {orgName}.
          </li>
          <li>
            Wallet: aviso visible en el teléfono (máx. 3 por pase cada 24 h; luego el texto queda dentro del pase).
          </li>
          {scheduled ? <li>Las programadas se procesan en la ejecución diaria del servidor, no a la hora exacta.</li> : null}
        </ul>
      </aside>
    </div>
  );
}
