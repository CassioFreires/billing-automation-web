import api from "./api";

export type PaymentProvider = "infinitepay" | "mercadopago" | "mock";

export interface PaymentSettings {
  provider: PaymentProvider;
  infinitepayHandle?: string | null;
  redirectUrl?: string | null;
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
}

export default new SettingsService();
