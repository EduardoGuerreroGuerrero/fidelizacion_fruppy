// WalletProvider: la DB es la fuente de verdad; Wallet es una proyección.
// Un fallo de Wallet NUNCA revierte ni invalida movimientos de fidelización.

export interface WalletPassData {
  /** serialNumber de Apple/Google = id estable de la tarjeta (card.id). */
  serialNumber: string;
  orgName: string;
  firstName: string;
  programName: string;
  /** null si el programa es de puntos. */
  stamps: { current: number; goal: number | null } | null;
  points: number | null;
  /** URL pública /t/{token} — también es el payload del barcode. */
  cardUrl: string;
  revoked: boolean;
}

export interface WalletIssueResult {
  /** .pkpass firmado listo para descargar, o null si Apple no configurado. */
  applePkpass: Uint8Array | null;
  /** URL "Add to Google Wallet" firmada, o null si Google no configurado. */
  googleSaveUrl: string | null;
}

export interface WalletProvider {
  readonly name: string;
  /** true si hay credenciales suficientes para operar. */
  configured(): boolean;
  /** true si Google Wallet está configurado (para mostrar el botón al cliente). */
  googleEnabled(): boolean;
  /** true si Apple Wallet está configurado (para mostrar el botón al cliente). */
  appleEnabled(): boolean;
  issuePass(data: WalletPassData): Promise<WalletIssueResult>;
  /** Push del estado actual leído vía load() — idempotente por naturaleza. */
  updatePass(serialNumber: string): Promise<void>;
  /** Revocación lógica: marca el pase como vacío/inactivo en la wallet. */
  revokePass(serialNumber: string): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; detail?: string }>;
}

export class WalletNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider}_not_configured`);
    this.name = "WalletNotConfiguredError";
  }
}
