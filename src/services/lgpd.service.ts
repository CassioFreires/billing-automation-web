import api from "./api";

/** Direitos do titular (LGPD — specs 0004 + 0022). */
class LgpdService {
  /** Exporta um titular (cliente do dono) e suas faturas. */
  async exportClient(clientId: string): Promise<unknown> {
    const { data } = await api.get(`/lgpd/clients/${clientId}/export`);
    return data;
  }

  /** Anonimiza um titular (mantém faturas, remove PII). */
  async anonymizeClient(clientId: string): Promise<unknown> {
    const { data } = await api.post(`/lgpd/clients/${clientId}/anonymize`);
    return data;
  }

  /** Exporta os dados da própria conta (portabilidade). */
  async exportAccount(): Promise<unknown> {
    const { data } = await api.get(`/lgpd/account/export`);
    return data;
  }

  /** Encerra a própria conta (exige o nome exato como confirmação). */
  async deleteAccount(confirmName: string): Promise<{ deleted: boolean }> {
    const { data } = await api.post(`/lgpd/account/delete`, { confirmName });
    return data;
  }
}

export default new LgpdService();

/** Dispara o download de um objeto JSON como arquivo no navegador. */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
