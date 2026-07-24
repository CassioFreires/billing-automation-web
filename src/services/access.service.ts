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
}

export default new AccessService();
