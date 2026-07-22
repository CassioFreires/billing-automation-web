import api from "./api";

/** Gateways suportados (spec 0019). */
export type PaymentProvider =
  | "infinitepay"
  | "mercadopago"
  | "mock"
  | "asaas"
  | "pagbank"
  | "efi"
  | "stripe"
  | "pagarme";

/** Segredos por provider — write-only (a API nunca os devolve). */
export interface PaymentCredentials {
  apiKey?: string; // asaas
  token?: string; // pagbank
  clientId?: string; // efi
  clientSecret?: string; // efi
  certificateBase64?: string; // efi (PIX/mTLS)
  secretKey?: string; // stripe | pagarme
  webhookSecret?: string; // stripe | pagarme | mercadopago
  webhookToken?: string; // asaas | efi
  accessToken?: string; // mercadopago
}

/** Leitura: sem segredos, só quais estão setados (`credentialStatus`). */
export interface PaymentSettings {
  provider: PaymentProvider;
  infinitepayHandle?: string | null;
  redirectUrl?: string | null;
  credentialStatus?: Partial<Record<keyof PaymentCredentials, boolean>>;
}

/** Escrita: segredos opcionais (em branco = mantém o salvo). */
export interface PaymentSettingsInput {
  provider: PaymentProvider;
  infinitepayHandle?: string | null;
  redirectUrl?: string | null;
  credentials?: PaymentCredentials;
}

export type WhatsappProvider = "log" | "cloud";

/** Leitura mascarada: o token nunca vem da API (só se está setado). */
export interface WhatsappSettings {
  provider: WhatsappProvider;
  phoneNumberId?: string | null;
  apiVersion?: string | null;
  hasToken: boolean;
}

/** Escrita: token opcional (só envie ao trocar; ausente mantém o salvo). */
export interface WhatsappSettingsInput {
  provider: WhatsappProvider;
  phoneNumberId?: string | null;
  token?: string | null;
  apiVersion?: string | null;
}

/** Regras de autonegociação por tenant (spec 0018 — M2, Botão de Alívio). */
export interface NegotiationSettings {
  enabled: boolean;
  hesitationOpens: number;
  discountEnabled: boolean;
  discountPercent: number; // 0..1
  installmentsEnabled: boolean;
  maxInstallments: number;
  deferEnabled: boolean;
  deferMaxDays: number;
  deferFeePercent: number; // 0..1
}

/** Régua de cobrança multi-passo por tenant (spec 0026). */
export interface ReguaStep {
  offsetDays: number;
  message?: string;
}

export interface ReguaSettings {
  enabled: boolean;
  steps: ReguaStep[];
}

/** Canal de envio das cobranças por tenant (spec 0032). */
export type NotifyChannel = "whatsapp" | "email" | "both";

export interface ChannelSettings {
  channel: NotifyChannel;
}

class SettingsService {
  async getPayment(): Promise<PaymentSettings> {
    const response = await api.get("/settings/payment");
    return response.data;
  }

  async updatePayment(data: PaymentSettingsInput): Promise<PaymentSettings> {
    const response = await api.put("/settings/payment", data);
    return response.data;
  }

  async getWhatsapp(): Promise<WhatsappSettings> {
    const response = await api.get("/settings/whatsapp");
    return response.data;
  }

  async updateWhatsapp(data: WhatsappSettingsInput): Promise<WhatsappSettings> {
    const response = await api.put("/settings/whatsapp", data);
    return response.data;
  }

  async getNegotiation(): Promise<NegotiationSettings> {
    const response = await api.get("/settings/negotiation");
    return response.data;
  }

  async updateNegotiation(data: NegotiationSettings): Promise<NegotiationSettings> {
    const response = await api.put("/settings/negotiation", data);
    return response.data;
  }

  async getRegua(): Promise<ReguaSettings> {
    const response = await api.get("/settings/regua");
    return response.data;
  }

  async updateRegua(data: ReguaSettings): Promise<ReguaSettings> {
    const response = await api.put("/settings/regua", data);
    return response.data;
  }

  async getChannel(): Promise<ChannelSettings> {
    const response = await api.get("/settings/channel");
    return response.data;
  }

  async updateChannel(data: ChannelSettings): Promise<ChannelSettings> {
    const response = await api.put("/settings/channel", data);
    return response.data;
  }
}

export default new SettingsService();
