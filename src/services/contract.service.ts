import api from "./api";

/** Contrato no Celular (backend spec 0040 / F14) — config do dono. */
export interface ContractSettings {
  enabled: boolean;
  title: string;
  body: string;
  version: number;
  mode: "text" | "file";
  fileName: string | null;
  fileSize: number | null;
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
  /** Sobe o PDF do contrato (corpo binário). */
  async uploadFile(file: File) {
    const { data } = await api.put("/contract/file", file, {
      headers: { "Content-Type": "application/pdf" },
      params: { name: file.name },
    });
    return data as { mode: string; fileName: string; fileSize: number; version: number };
  }
  /** Baixa o PDF (com auth) como blob — para o dono pré-visualizar. */
  async getFileBlob(): Promise<Blob> {
    const { data } = await api.get("/contract/file", { responseType: "blob" });
    return data as Blob;
  }
}

export default new ContractService();
