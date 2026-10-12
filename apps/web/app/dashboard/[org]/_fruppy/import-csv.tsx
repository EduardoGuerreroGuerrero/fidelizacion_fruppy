"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importCustomers, type CsvRow } from "@/lib/customers/actions";
import { IconUpload } from "@/app/t/[token]/_components/icons";

// Parser CSV mínimo: cabeceras nombre/apellido/email/telefono (o columnas
// posicionales en ese orden). Comillas dobles soportadas.
function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === ";") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim())) rows.push(row);
  if (rows.length === 0) return [];

  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  const header = rows[0].map(norm);
  const find = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  let idx = {
    first: find("nombre", "first", "name"),
    last: find("apellido", "last"),
    email: find("email", "correo", "mail"),
    phone: find("tel", "phone", "cel", "movil"),
  };
  let body = rows;
  if (idx.first === -1 && idx.email === -1 && idx.phone === -1) {
    // Sin cabecera reconocible: posicional nombre,apellido,email,telefono.
    idx = { first: 0, last: 1, email: 2, phone: 3 };
  } else {
    body = rows.slice(1);
    if (idx.first === -1) idx.first = 0;
  }
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  return body
    .map((r) => ({
      first_name: cell(r, idx.first),
      last_name: cell(r, idx.last),
      email: cell(r, idx.email),
      phone: cell(r, idx.phone),
    }))
    .filter((r) => r.first_name);
}

export function ImportCsvButton({ slug }: { slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = (file: File) => {
    startTransition(async () => {
      try {
        const text = await file.text();
        const rows = parseCsv(text);
        if (rows.length === 0) {
          setResult({ ok: false, text: "El archivo no tiene filas válidas." });
          return;
        }
        const res = await importCustomers(slug, rows.slice(0, 200));
        setResult({
          ok: true,
          text: `Importados ${res.created} · omitidos ${res.skipped}`,
        });
        router.refresh();
      } catch {
        setResult({ ok: false, text: "No se pudo importar el archivo." });
      }
    });
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:opacity-60"
      >
        <IconUpload className="size-4" />
        {pending ? "Importando…" : "Importar CSV"}
      </button>
      {result && (
        <span
          className={`text-xs font-medium ${result.ok ? "text-brand-dark" : "text-accent"}`}
        >
          {result.text}
        </span>
      )}
    </span>
  );
}
