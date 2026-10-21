// Etiquetas en español para valores técnicos que se guardan en la base
// (inglés/snake_case) y no deben mostrarse tal cual en la interfaz.

const PROGRAM_TYPE: Record<string, string> = { stamps: "Sellos", points: "Puntos" };

const STATUS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  archived: "Archivado",
  draft: "Borrador",
  suspended: "Suspendido",
  invited: "Invitado",
  pending: "Pendiente",
  accepted: "Aceptada",
  cancelled: "Cancelada",
  expired: "Vencida",
  completed: "Completado",
  reversed: "Revertido",
  revoked: "Revocada",
  queued: "En cola",
  sent: "Enviada",
  failed: "Fallida",
};

const ROLE: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  manager: "Encargado",
  staff: "Equipo",
};

const VISIT_SOURCE: Record<string, string> = {
  staff_qr: "escaneo con QR",
  manual: "manual",
  pos: "punto de venta",
};

export const programTypeLabel = (v: string) => PROGRAM_TYPE[v] ?? v;
export const statusLabel = (v: string) => STATUS[v] ?? v;
export const roleLabel = (v: string) => ROLE[v] ?? v;
export const visitSourceLabel = (v: string) => VISIT_SOURCE[v] ?? v;

// `reason` de los movimientos del ledger guarda claves internas
// ("qr_scan", "redemption:<uuid>"…): se traducen y nunca se muestran ids.
export function reasonLabel(reason: string | null | undefined): string | null {
  if (!reason) return null;
  if (reason === "qr_scan") return "escaneo de QR";
  if (reason.startsWith("redemption:")) return "canje de recompensa";
  if (reason.startsWith("reversal")) return "reverso";
  return reason;
}
