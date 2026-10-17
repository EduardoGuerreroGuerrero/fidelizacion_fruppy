import { readFileSync } from "node:fs";
import {
  Wallet,
  field,
  googleSaveUrl,
  type LoadedPass,
  type PassContent,
  type WalletConfig,
} from "passlet";
import { passDataBySerial } from "./pass-data";
import {
  WalletNotConfiguredError,
  type WalletIssueResult,
  type WalletPassData,
  type WalletProvider,
} from "./provider";

// Adapter passlet: credenciales SOLO desde variables de entorno (paths a
// certs fuera del repo o PEM inline desde gestor de secretos). Este módulo
// solo se importa en server code — nada llega al bundle de cliente.
//
// Apple webService (push a dispositivos) requiere un storage de
// registrations: queda pendiente. Sin él, los pases Apple se actualizan
// cuando el cliente los re-descarga — aceptable en MVP. Google sí recibe
// updates vía wallet.update() → load() lee el estado real desde la DB.

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

  configured(): boolean {
    return this.appleConfigured() || this.googleConfigured();
  }

  googleEnabled(): boolean {
    return this.googleConfigured();
  }

  appleEnabled(): boolean {
    return this.appleConfigured();
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

  private getWallet() {
    if (this.wallet) return this.wallet;
    if (!this.configured()) throw new WalletNotConfiguredError(this.name);

    const config: WalletConfig = {
      // load() alimenta wallet.update() y webService: re-lee el estado real
      // desde la DB por serial — la proyección nunca persiste su propia verdad.
      load: async (serial): Promise<LoadedPass | null> => {
        const data = await passDataBySerial(serial);
        if (!data) return null;
        const { serialNumber: _serial, ...content } = this.contentOf(data);
        void _serial;
        return { content, template: this.templateOf(data), updatedAt: new Date() };
      },
    };

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
    const wallet = this.getWallet();
    const baseUrl = env("NEXT_PUBLIC_BASE_URL");
    // Template estable: los campos se definen una vez; cada pase solo fija
    // `values`. changeMessage hace que Apple muestre aviso al actualizar.
    return wallet.loyalty({
      id: "fruppy-loyalty",
      name: data.programName,
      color: "#0d9488",
      apple: baseUrl
        ? {
            icon: {
              base: `${baseUrl}/brand/wallet-icon.png`,
              retina: `${baseUrl}/brand/wallet-icon@2x.png`,
            },
            // ?v=2: Google cachea imágenes por URL; versionado para refresco.
            logo: `${baseUrl}/brand/wallet-logo.png?v=2`,
            logoText: data.orgName,
            description: `${data.programName} — ${data.orgName}`,
          }
        : undefined,
      google: baseUrl
        ? {
            issuerName: data.orgName,
            // Logo del comercio si lo subió; si no, el genérico de la marca
            // SaaS. Sin "hero": sin esa imagen la tarjeta queda unicolor
            // (antes mostraba una promo fija de ejemplo, ajena al comercio).
            logo: data.logoUrl ?? `${baseUrl}/brand/wallet-logo.png?v=2`,
          }
        : undefined,
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

  async issuePass(data: WalletPassData): Promise<WalletIssueResult> {
    const issued = await this.templateOf(data).create(this.contentOf(data));
    return {
      applePkpass: issued.apple ?? null,
      googleSaveUrl: issued.google ? googleSaveUrl(issued.google) : null,
    };
  }

  async updatePass(serialNumber: string): Promise<void> {
    // update() re-lee el estado vía load() → idempotente, safe para retry.
    // notify: Google alerta al usuario de los campos con changeMessage (sin
    // esto el pase se actualiza en silencio). En Apple no aplica: APNs
    // siempre avisa cuando hay changeMessage.
    await this.getWallet().update(serialNumber, { notify: true });
  }

  async sendPassMessage(
    serialNumber: string,
    message: { header: string; body: string; notify?: boolean },
  ): Promise<void> {
    // sendMessage vive en la plantilla; la reconstruimos desde la DB como en
    // update() — la fuente de verdad no es el pase emitido sino la tarjeta.
    const data = await passDataBySerial(serialNumber);
    if (!data) return;
    await this.templateOf(data).sendMessage(serialNumber, {
      header: message.header,
      body: message.body,
      messageType: message.notify === false ? "TEXT" : "TEXT_AND_NOTIFY",
    });
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
