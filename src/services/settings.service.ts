import api from "./api";

export type PaymentProvider = "infinitepay" | "mercadopago" | "mock";

export interface PaymentSettings {
  provider: PaymentProvider;
  infinitepayHandle?: string | null;
  redirectUrl?: string | null;
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

class SettingsService {
  async getPayment(): Promise<PaymentSettings> {
    const response = await api.get("/settings/payment");
    return response.data;
  }

  async updatePayment(data: PaymentSettings): Promise<PaymentSettings> {
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
}

export default new SettingsService();
