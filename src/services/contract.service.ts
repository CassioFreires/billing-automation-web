import api from "./api";

/** Contrato no Celular (backend spec 0040 / F14) — config do dono. */
export interface ContractSettings {
  enabled: boolean;
  title: string;
  body: string;
  version: number;
}

class ContractService {
  async getSettings(): Promise<ContractSettings> {
    const { data } = await api.get("/contract/settings");
    return data;
  }
  async updateSettings(patch: Partial<ContractSettings>): Promise<ContractSettings> {
    const { data } = await api.put("/contract/settings", patch);
    return data;
  }
}

export default new ContractService();
