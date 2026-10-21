"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { IconScan } from "@/app/t/[token]/_components/icons";

const READER_ID = "qr-reader";

// El QR apunta a /t/<token>; también acepta el token crudo.
function extractToken(decoded: string): string {
  const match = decoded.match(/\/t\/([A-Za-z0-9_-]+)/);
  return (match ? match[1] : decoded).trim();
}

export function ScanForm({
  action,
  initialToken,
  hasStamps,
  hasPoints,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialToken: string;
  hasStamps: boolean;
  hasPoints: boolean;
}) {
  const [token, setToken] = useState(initialToken);
  // Clave de idempotencia por render: reintentos/doble-clic no duplican visitas.
  const [idem] = useState(() => crypto.randomUUID());
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
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

  async function startScanner() {
    setCamError(null);
    try {
      const scanner = new Html5Qrcode(READER_ID);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          setToken(extractToken(decoded));
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

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="idem" value={idem} />

      <div id={READER_ID} className="overflow-hidden rounded-xl" />

      {scanning ? (
        <button
          type="button"
          onClick={() => void stopScanner()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-100 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-neutral-200"
        >
          Detener cámara
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void startScanner()}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-dark px-4 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-brand-deeper"
        >
          <IconScan className="size-6" />
          Escanear con cámara
        </button>
      )}
      {camError && <p className="text-xs text-accent">{camError}</p>}

      <div>
        <label htmlFor="token" className="mb-1 block text-sm font-medium text-ink">
          Token del QR
        </label>
        <input
          id="token"
          name="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          autoFocus
          autoComplete="off"
          placeholder="Aparece al escanear, o pégalo aquí"
          className="w-full rounded-xl bg-neutral-100 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>
      {hasStamps && (
        <div>
          <label htmlFor="stamps" className="mb-1 block text-sm font-medium text-ink">
            Sellos a otorgar
          </label>
          <input
            id="stamps"
            name="stamps"
            type="number"
            min={0}
            max={20}
            defaultValue={1}
            className="w-24 rounded-xl bg-neutral-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          />
          {hasPoints && (
            <p className="mt-1 text-xs text-ink-soft">
              Se usa si la tarjeta es de un programa por sellos.
            </p>
          )}
        </div>
      )}
      {hasPoints && (
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-ink">
            Monto de la compra
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="Ej. 15000"
            className="w-40 rounded-xl bg-neutral-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Se convierte en puntos según la regla del programa
            {hasStamps ? " (si la tarjeta es de un programa por puntos)" : ""}.
          </p>
        </div>
      )}
      <button
        type="submit"
        className="w-full rounded-full bg-brand-dark px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deeper"
      >
        Registrar visita
      </button>
    </form>
  );
}
