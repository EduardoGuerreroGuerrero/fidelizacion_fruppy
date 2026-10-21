import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addBusinessDays,
  colombiaHolidays,
  rightsDeadline,
  rightsDeadlineDays,
} from "../lib/legal/deadlines";

const d = (s: string) => new Date(`${s}T12:00:00Z`);
const ymd = (x: Date) => x.toISOString().slice(0, 10);

test("consultas 10 días hábiles; reclamos 15 (Ley 1581 arts. 14-15)", () => {
  assert.equal(rightsDeadlineDays("access"), 10);
  for (const t of ["rectification", "erasure", "revocation", "complaint"]) {
    assert.equal(rightsDeadlineDays(t), 15, t);
  }
});

test("festivos de Colombia 2026 (Emiliani + Semana Santa)", () => {
  const h = colombiaHolidays(2026);
  for (const f of [
    "2026-01-01",
    "2026-01-12", // Reyes (6 ene, martes → lunes 12)
    "2026-03-23", // San José (19 mar, jueves → lunes 23)
    "2026-04-02", // jueves santo (Pascua 5 abr)
    "2026-04-03", // viernes santo
    "2026-05-01",
    "2026-05-18", // Ascensión
    "2026-06-08", // Corpus Christi
    "2026-06-15", // Sagrado Corazón
    "2026-06-29", // San Pedro (lunes, se queda)
    "2026-07-20",
    "2026-08-07",
    "2026-08-17", // Asunción (15 ago, sábado → lunes 17)
    "2026-10-12", // Raza (lunes)
    "2026-11-02", // Todos los Santos (1 nov, domingo → lunes 2)
    "2026-11-16", // Independencia Cartagena (11 nov, miércoles → lunes 16)
    "2026-12-08",
    "2026-12-25",
  ]) {
    assert.ok(h.has(f), `falta festivo ${f}`);
  }
  assert.equal(h.size, 18);
});

test("días hábiles: salta fines de semana", () => {
  // viernes 2026-10-23 + 1 día hábil = lunes 26
  assert.equal(ymd(addBusinessDays(d("2026-10-23"), 1)), "2026-10-26");
  // lunes 2026-10-19 + 5 = lunes 26
  assert.equal(ymd(addBusinessDays(d("2026-10-19"), 5)), "2026-10-26");
});

test("días hábiles: salta festivos", () => {
  // Oct 2026: lunes 12 festivo. viernes 9 + 1 hábil → martes 13.
  assert.equal(ymd(addBusinessDays(d("2026-10-09"), 1)), "2026-10-13");
});

test("plazo de una consulta radicada el 2026-10-21 (miércoles)", () => {
  const { days, due } = rightsDeadline("access", d("2026-10-21"));
  assert.equal(days, 10);
  // 22,23 | 26-30 | 2 nov (festivo) → 3,4,5 :: 10 hábiles = 4 nov? cuenta:
  // oct 22(1) 23(2) 26(3) 27(4) 28(5) 29(6) 30(7) nov 2 festivo, 3(8) 4(9) 5(10)
  assert.equal(ymd(due), "2026-11-05");
});
