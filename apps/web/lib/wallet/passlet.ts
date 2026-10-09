import { readFileSync } from "node:fs";
import {
  Wallet,
  field,
  googleSaveUrl,
  type LoadedPass,
  type PassContent,
  type WalletConfig,
} from "passlet";
import {
  WalletNotConfiguredError,
  type LoadPassFn,
  type WalletIssueResult,
  type WalletPassData,
  type WalletProvider,
} from "./provider";

type PassletLoad = (serial: string) => Promise<LoadedPass | null>;

// Adapter passlet: credenciales SOLO desde variables de entorno (paths a
// certs fuera del repo o PEM inline desde gestor de secretos). Este módulo
// solo se importa en server code — nada llega al bundle de cliente.
//
// Apple webService (push a dispositivos) requiere un storage de
// registrations: queda pendiente para cuando haya credenciales reales.
// Sin él, los pases Apple son estáticos tras emitirse — aceptable en MVP.

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function pem(pathVar: string, inlineVar: string): string | undefined {
  const inline = env(inlineVar);
  if (inline) return inline;
  const path = env(pathVar);
  return path ? readFileSync(path, "utf8") : undefined;
}

export class PassletWalletProvider implements WalletProvider {
  readonly name = "passlet";
  private wallet: Wallet | null = null;
  private loadFn: PassletLoad | null = null;

  configured(): boolean {
    return this.appleConfigured() || this.googleConfigured();
  }

  private appleConfigured() {
    return (
      env("APPLE_WALLET_ENABLED") === "true" &&
      !!env("APPLE_PASS_TYPE_ID") &&
      !!env("APPLE_TEAM_ID") &&
      !!pem("APPLE_PASS_CERT_PATH", "APPLE_PASS_CERT_PEM") &&
      !!pem("APPLE_PASS_KEY_PATH", "APPLE_PASS_KEY_PEM") &&
      !!pem("APPLE_WWDR_CERT_PATH", "APPLE_WWDR_PEM")
    );
  }

  private googleConfigured() {
    return (
      env("GOOGLE_WALLET_ENABLED") === "true" &&
      !!env("GOOGLE_WALLET_ISSUER_ID") &&
      !!this.googleCreds()
    );
  }

  private googleCreds(): { clientEmail: string; privateKey: string } | null {
    const privateKey = env("GOOGLE_WALLET_PRIVATE_KEY");
    const inlineJson = env("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON");
    const credPath = env("GOOGLE_APPLICATION_CREDENTIALS");
    let clientEmail: string | undefined;
    let key = privateKey;
    if (inlineJson || credPath) {
      try {
        const json = JSON.parse(inlineJson ?? readFileSync(credPath!, "utf8"));
        clientEmail = json.client_email;
        key = key ?? json.private_key;
      } catch {
        return null;
      }
    }
    if (!clientEmail || !key) return null;
    return { clientEmail, privateKey: key };
  }

  private getWallet(load: PassletLoad) {
    if (this.wallet) return this.wallet;
    if (!this.configured()) throw new WalletNotConfiguredError(this.name);
    this.loadFn = load;

    const config: WalletConfig = { load };

    if (this.appleConfigured()) {
      config.apple = {
        passTypeIdentifier: env("APPLE_PASS_TYPE_ID")!,
        teamId: env("APPLE_TEAM_ID")!,
        signerCert: pem("APPLE_PASS_CERT_PATH", "APPLE_PASS_CERT_PEM")!,
        signerKey: pem("APPLE_PASS_KEY_PATH", "APPLE_PASS_KEY_PEM")!,
        wwdr: pem("APPLE_WWDR_CERT_PATH", "APPLE_WWDR_PEM")!,
      };
    }

    const gc = this.googleCreds();
    if (this.googleConfigured() && gc) {
      config.google = {
        issuerId: env("GOOGLE_WALLET_ISSUER_ID")!,
        clientEmail: gc.clientEmail,
        privateKey: gc.privateKey,
        origins: env("NEXT_PUBLIC_BASE_URL") ? [env("NEXT_PUBLIC_BASE_URL")!] : undefined,
      };
    }

    this.wallet = new Wallet(config);
    return this.wallet;
  }

  private templateOf(data: WalletPassData) {
    const wallet = this.getWallet(this.loadFn ?? (async () => null));
    // Template estable: los campos se definen una vez; cada pase solo fija
    // `values`. changeMessage hace que Apple muestre aviso al actualizar.
    return wallet.loyalty({
      id: "fruppy-loyalty",
      name: data.programName,
      fields: [
        field.secondary("holder", "Cliente"),
        field.secondary("org", "Comercio"),
        field.primary("balance", "Sellos", { changeMessage: "Sellos: %@" }),
        field.primary("points", "Puntos", { changeMessage: "Puntos: %@" }),
      ],
    });
  }

  private contentOf(data: WalletPassData): PassContent {
    return {
      serialNumber: data.serialNumber,
      values: {
        holder: data.firstName,
        org: data.orgName,
        balance: data.stamps ? `${data.stamps.current}/${data.stamps.goal ?? "?"}` : null,
        points: data.points != null ? String(data.points) : null,
      },
      barcode: { format: "QR", value: data.cardUrl },
      apple: data.revoked ? { voided: true } : undefined,
    };
  }

  async issuePass(data: WalletPassData, load: LoadPassFn): Promise<WalletIssueResult> {
    this.getWallet(load as PassletLoad);
    const issued = await this.templateOf(data).create(this.contentOf(data));
    return {
      applePkpass: issued.apple ?? null,
      googleSaveUrl: issued.google ? googleSaveUrl(issued.google) : null,
    };
  }

  async updatePass(serialNumber: string): Promise<void> {
    // update() re-lee el estado vía load() → idempotente, safe para retry.
    if (!this.wallet || !this.loadFn) throw new WalletNotConfiguredError(this.name);
    await this.wallet.update(serialNumber);
  }

  async revokePass(serialNumber: string): Promise<void> {
    // Las wallets no tienen "revoke": el push re-renderiza vía load() y la
    // tarjeta web /t/{token} ya muestra el estado revocado.
    await this.updatePass(serialNumber);
  }

  async healthCheck() {
    if (!this.configured()) return { ok: false, detail: "wallet_not_configured" };
    return { ok: true };
  }
}

export const walletProvider: WalletProvider = new PassletWalletProvider();
