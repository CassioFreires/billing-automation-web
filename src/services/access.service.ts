import api from "./api";

/** Liga/Desliga o Acesso (backend spec 0042 / F12). */
export interface AccessSettings {
  enabled: boolean;
  graceDays: number;
  requireSignedContract: boolean;
}

export interface ClientAccess {
  clientId: string;
  name: string;
  state: "allowed" | "grace" | "blocked";
  granted: boolean;
  reason: string;
  override: "allow" | "block" | "none";
  maxDaysOverdue: number;
}

export type AccessOverride = "allow" | "block" | "none";

/** Conexão IoT/Catracas (backend spec 0043 / F13). */
export interface AccessIntegration {
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyPrefix: string | null;
  webhookUrl: string | null;
  webhookConfigured: boolean;
  webhookSecret: string | null;
}

export interface AccessEvent {
  id: string;
  clientId: string;
  clientName: string;
  fromState: string | null;
  toState: "allowed" | "grace" | "blocked";
  granted: boolean;
  reason: string;
  webhookStatus: "skipped" | "sent" | "failed";
  webhookCode: number | null;
  createdAt: string;
}

export interface WebhookTestResult {
  status: "sent" | "failed";
  code?: number;
  error?: string;
}

class AccessService {
  async getSettings(): Promise<AccessSettings> {
    const { data } = await api.get("/access/settings");
    return data;
  }
  async updateSettings(patch: Partial<AccessSettings>): Promise<AccessSettings> {
    const { data } = await api.put("/access/settings", patch);
    return data;
  }
  async listClients(): Promise<ClientAccess[]> {
    const { data } = await api.get("/access/clients");
    return data;
  }
  async setOverride(clientId: string, override: AccessOverride) {
    const { data } = await api.post(`/access/clients/${clientId}/override`, { override });
    return data;
  }

  // --- Conexão IoT/Catracas (F13) ---
  async getIntegration(): Promise<AccessIntegration> {
    const { data } = await api.get("/access/integration");
    return data;
  }
  async setIntegrationEnabled(enabled: boolean): Promise<AccessIntegration> {
    const { data } = await api.put("/access/integration", { enabled });
    return data;
  }
  async rotateApiKey(): Promise<{ apiKey: string; apiKeyPrefix: string }> {
    const { data } = await api.post("/access/integration/api-key/rotate");
    return data;
  }
  async revokeApiKey(): Promise<AccessIntegration> {
    const { data } = await api.post("/access/integration/api-key/revoke");
    return data;
  }
  async setWebhook(webhookUrl: string): Promise<AccessIntegration> {
    const { data } = await api.put("/access/integration/webhook", { webhookUrl });
    return data;
  }
  async clearWebhook(): Promise<AccessIntegration> {
    const { data } = await api.delete("/access/integration/webhook");
    return data;
  }
  async testWebhook(): Promise<WebhookTestResult> {
    const { data } = await api.post("/access/integration/webhook/test");
    return data;
  }
  async listEvents(limit = 50): Promise<AccessEvent[]> {
    const { data } = await api.get("/access/events", { params: { limit } });
    return data;
  }
}

export default new AccessService();
