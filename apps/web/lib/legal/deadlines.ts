// Plazos legales de respuesta a los titulares (Ley 1581 de 2012, Colombia).
//  - Consultas (acceso a los datos): 10 días hábiles — art. 14.
//  - Reclamos (corrección, supresión, revocación, queja): 15 días hábiles — art. 15.
// Ambos prorrogables una vez (5 y 8 días hábiles) informando al titular el
// motivo; aquí se calcula el plazo base.

export type RightsRequestType =
  | "access"
  | "rectification"
  | "erasure"
  | "revocation"
  | "complaint";

export function rightsDeadlineDays(type: string): number {
  return type === "access" ? 10 : 15;
}

// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher), en UTC.
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

// Ley Emiliani: el festivo se traslada al lunes siguiente (si ya es lunes, queda).
function toMonday(d: Date): Date {
  const dow = d.getUTCDay(); // 0 dom … 6 sáb
  return dow === 1 ? d : addDays(d, (8 - dow) % 7);
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

const holidayCache = new Map<number, Set<string>>();

// Festivos nacionales de Colombia de un año (claves YYYY-MM-DD, UTC).
export function colombiaHolidays(year: number): Set<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const u = (m: number, d: number) => new Date(Date.UTC(year, m - 1, d));
  const easter = easterSunday(year);
  const days: Date[] = [
    // fijos
    u(1, 1),
    u(5, 1),
    u(7, 20),
    u(8, 7),
    u(12, 8),
    u(12, 25),
    // trasladables al lunes (Ley Emiliani)
    toMonday(u(1, 6)),
    toMonday(u(3, 19)),
    toMonday(u(6, 29)),
    toMonday(u(8, 15)),
    toMonday(u(10, 12)),
    toMonday(u(11, 1)),
    toMonday(u(11, 11)),
    // Semana Santa y festivos móviles ligados a la Pascua
    addDays(easter, -3), // jueves santo
    addDays(easter, -2), // viernes santo
    addDays(easter, 43), // Ascensión (lunes)
    addDays(easter, 64), // Corpus Christi (lunes)
    addDays(easter, 71), // Sagrado Corazón (lunes)
  ];
  const set = new Set(days.map(ymd));
  holidayCache.set(year, set);
  return set;
}

export function isBusinessDay(d: Date): boolean {
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !colombiaHolidays(d.getUTCFullYear()).has(ymd(d));
}

// Fecha límite = `days` días hábiles después de `from` (el día de radicación
// no cuenta). Opera sobre la fecha UTC; suficiente para un plazo en días.
export function addBusinessDays(from: Date, days: number): Date {
  let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  let left = days;
  while (left > 0) {
    d = addDays(d, 1);
    if (isBusinessDay(d)) left -= 1;
  }
  return d;
}

export function rightsDeadline(type: string, createdAt: Date): { days: number; due: Date } {
  const days = rightsDeadlineDays(type);
  return { days, due: addBusinessDays(createdAt, days) };
}
