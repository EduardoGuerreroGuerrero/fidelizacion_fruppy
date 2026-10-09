"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const READER_ID = "qr-reader";

// El QR apunta a /t/<token>; también acepta el token crudo.
function extractToken(decoded: string): string {
  const match = decoded.match(/\/t\/([A-Za-z0-9_-]+)/);
  return (match ? match[1] : decoded).trim();
}

export function ScanForm({
  action,
  initialToken,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialToken: string;
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

      <div id={READER_ID} className="overflow-hidden rounded-md" />

      {scanning ? (
        <button
          type="button"
          onClick={() => void stopScanner()}
          className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Detener cámara
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void startScanner()}
          className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Escanear con cámara
        </button>
      )}
      {camError && <p className="text-xs text-red-600 dark:text-red-400">{camError}</p>}

      <div>
        <label htmlFor="token" className="mb-1 block text-sm font-medium">
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-transparent"
        />
      </div>
      <div>
        <label htmlFor="stamps" className="mb-1 block text-sm font-medium">
          Sellos a otorgar
        </label>
        <input
          id="stamps"
          name="stamps"
          type="number"
          min={0}
          max={20}
          defaultValue={1}
          className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
      >
        Registrar visita
      </button>
    </form>
  );
}
