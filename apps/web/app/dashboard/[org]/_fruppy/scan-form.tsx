"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import {
  IconBulb,
  IconCamera,
  IconCheckCircle,
  IconGift,
  IconKeyboard,
  IconMail,
  IconPhone,
  IconScan,
  IconTag,
} from "@/app/t/[token]/_components/icons";
import { lookupCardCustomer, type CardPreview } from "@/lib/loyalty/preview";
import { displayName } from "@/lib/format";
import { Avatar, Chip, IconTile } from "./ui";

const READER_ID = "qr-reader-fruppy";

// El QR apunta a /t/<token>; también acepta el token crudo.
function extractToken(decoded: string): string {
  const match = decoded.match(/\/t\/([A-Za-z0-9_-]+)/);
  return (match ? match[1] : decoded).trim();
}

export function FruppyScanForm({
  slug,
  action,
  initialToken,
}: {
  slug: string;
  action: (formData: FormData) => void | Promise<void>;
  initialToken: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [stamps, setStamps] = useState(1);
  // Clave de idempotencia por render: reintentos/doble-clic no duplican visitas.
  const [idem] = useState(() => crypto.randomUUID());
  const [tab, setTab] = useState<"camera" | "manual">("camera");
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CardPreview | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // ya estaba detenido
      }
    }
  }

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  // Previsualización "Cliente detectado": resuelve el token con debounce.
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const t = token.trim();
      const p = t.length >= 8 ? await lookupCardCustomer(slug, t) : null;
      if (alive) setPreview(p);
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [slug, token]);

  async function startScanner() {
    setCamError(null);
    try {
      const scanner = new Html5Qrcode(READER_ID);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          setToken(extractToken(decoded));
          setTab("manual");
          void stopScanner();
        },
        () => {},
      );
      scannerRef.current = scanner;
      setScanning(true);
    } catch {
      setCamError(
        "No se pudo acceder a la cámara. Revisa los permisos del navegador o usa lector USB / pega el token.",
      );
    }
  }

  const base = `/dashboard/${slug}`;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[2fr_1fr]">
      {/* ===== Tarjeta principal ===== */}
      <form
        action={action}
        className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] sm:p-6"
      >
        <input type="hidden" name="idem" value={idem} />
        <input type="hidden" name="stamps" value={stamps} />

        {/* Tabs (web) */}
        <div className="mb-4 hidden gap-2 lg:flex">
          <button
            type="button"
            onClick={() => setTab("camera")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === "camera"
                ? "bg-gradient-to-r from-brand to-brand-dark text-white shadow-sm"
                : "text-ink-soft hover:bg-neutral-100"
            }`}
          >
            <IconCamera className="size-4" />
            Escanear con cámara
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === "manual"
                ? "bg-gradient-to-r from-brand to-brand-dark text-white shadow-sm"
                : "text-ink-soft hover:bg-neutral-100"
            }`}
          >
            <IconKeyboard className="size-4" />
            Ingreso manual
          </button>
        </div>

        {/* Área de escaneo (mint, borde punteado) */}
        {tab === "camera" && (
          <div className="relative flex flex-col items-center rounded-2xl border-2 border-dashed border-brand/50 bg-gradient-to-b from-pastel-mint/70 to-[#e8faf4] px-4 py-8 text-center">
            <div id={READER_ID} className="w-full overflow-hidden rounded-xl" />
            {!scanning && (
              <>
                <span className="flex items-center gap-3">
                  <svg viewBox="0 0 24 20" className="h-8 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden>
                    <path d="M4 2v4M12 2v6M20 2v4" />
                  </svg>
                  <IconScan className="size-12 text-brand-dark" strokeWidth={1.6} />
                  <svg viewBox="0 0 24 20" className="h-8 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden>
                    <path d="M4 2v4M12 2v6M20 2v4" />
                  </svg>
                </span>
                <p className="mt-3 font-bold text-navy">Escanear con cámara</p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  Apunta la cámara al código QR de la tarjeta del cliente
                </p>
                <button
                  type="button"
                  onClick={() => void startScanner()}
                  className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
                >
                  <IconCamera className="size-4" />
                  Escanear con cámara
                </button>
              </>
            )}
            {scanning && (
              <button
                type="button"
                onClick={() => void stopScanner()}
                className="mt-3 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-neutral-200"
              >
                Detener cámara
              </button>
            )}
          </div>
        )}
        {camError && <p className="mt-2 text-xs text-accent">{camError}</p>}

        {/* Separador (móvil) */}
        <div className="my-5 flex items-center gap-3 text-xs text-ink-soft lg:hidden">
          <span className="h-px flex-1 bg-neutral-200" />
          ó ingresa el token manualmente
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        {/* Token */}
        <div className={tab === "camera" ? "" : "mt-1"}>
          <label htmlFor="token" className="mb-1.5 block text-sm font-bold text-navy">
            Token del QR
          </label>
          <div className="relative">
            <IconTag className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand" />
            <input
              id="token"
              name="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoComplete="off"
              placeholder="Aparece al escanear, o pégalo aquí"
              className="w-full rounded-2xl border-2 border-brand/60 bg-white py-3 pl-10 pr-4 font-mono text-sm text-navy outline-none transition focus:border-brand"
            />
          </div>
        </div>

        {/* Stepper de sellos */}
        <div className="mt-4">
          <label htmlFor="stamps-stepper" className="mb-1.5 block text-sm font-bold text-navy">
            Sellos a otorgar
          </label>
          <div
            id="stamps-stepper"
            className="flex items-center justify-between rounded-2xl border-2 border-neutral-200 px-4 py-2.5"
          >
            <button
              type="button"
              aria-label="Quitar un sello"
              onClick={() => setStamps((s) => Math.max(0, s - 1))}
              className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-lg font-bold text-ink-soft transition hover:bg-neutral-200"
            >
              −
            </button>
            <span className="text-base font-bold tabular-nums text-navy">{stamps}</span>
            <button
              type="button"
              aria-label="Agregar un sello"
              onClick={() => setStamps((s) => Math.min(20, s + 1))}
              className="flex size-8 items-center justify-center rounded-full bg-pastel-mint text-lg font-bold text-brand-dark transition hover:bg-brand-soft"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-105"
        >
          <IconCheckCircle className="size-5" />
          Registrar visita
        </button>

        {/* Hint (móvil) */}
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-pastel-lav/60 px-4 py-3 text-xs text-ink-soft lg:hidden">
          <IconBulb className="mt-0.5 size-4 shrink-0 text-[#7c5cd6]" />
          Usa la cámara, un lector USB que escriba el token, o pégalo manualmente.
        </p>
      </form>

      {/* ===== Columna derecha ===== */}
      <div className="space-y-5">
        {/* Pasos (solo web — el mockup móvil no lo muestra) */}
        <div className="hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] lg:block">
          <h3 className="font-bold text-navy">¿Cómo registrar una visita?</h3>
          <ol className="relative mt-4 space-y-5">
            <span className="absolute bottom-5 left-[15px] top-5 w-px bg-pastel-pink" aria-hidden />
            {[
              ["Escanea la tarjeta", "Usa la cámara del dispositivo o un lector USB."],
              ["Verifica el cliente", "El sistema mostrará la información del cliente."],
              ["Confirma los sellos", "Ajusta la cantidad de sellos si es necesario."],
              ["Registra la visita", "Haz clic en el botón para guardar."],
            ].map(([title, desc], i) => (
              <li key={title} className="relative flex gap-3">
                <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Cliente detectado */}
        {preview && (
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-ink-soft">Cliente detectado</p>
            <div className="mt-2.5 flex items-center gap-3">
              <Avatar name={preview.name} size="size-12" textSize="text-sm" />
              <div className="min-w-0">
                <p className="truncate font-bold text-navy">{displayName(preview.name)}</p>
                <Link
                  href={`${base}/customers`}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Ver en clientes
                </Link>
              </div>
            </div>
            {preview.email && (
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                <IconMail className="size-4 shrink-0" />
                <span className="truncate">{preview.email}</span>
              </p>
            )}
            {preview.phone && (
              <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-soft">
                <IconPhone className="size-4 shrink-0" />
                {preview.phone}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {preview.marketing && <Chip tone="green">marketing</Chip>}
              <Chip tone={preview.status === "active" ? "teal" : "gray"}>
                {preview.status === "active" ? "activo" : preview.status}
              </Chip>
            </div>
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <p className="text-xs font-medium text-ink-soft">Programa</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2.5">
                  <IconTile tone="pink" size="size-9">
                    <IconGift className="size-4" />
                  </IconTile>
                  <span className="font-bold text-navy">{preview.programName}</span>
                </span>
                <Chip tone="pink">
                  {preview.programType === "stamps"
                    ? `${preview.currentStamps} / ${preview.stampGoal ?? "?"} sellos`
                    : `${preview.currentPoints} pts`}
                </Chip>
              </div>
              {preview.programType === "stamps" && preview.stampGoal ? (
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.min(100, (preview.currentStamps / preview.stampGoal) * 100)}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Hint (web) */}
        <p className="hidden items-start gap-2 rounded-2xl bg-pastel-lav/60 px-4 py-3 text-xs text-ink-soft lg:flex">
          <IconBulb className="mt-0.5 size-4 shrink-0 text-[#7c5cd6]" />
          Usa la cámara, un lector USB que escriba el token, o pégalo manualmente.
        </p>
      </div>
    </div>
  );
}
