import api from "./api";

/** Segura Quem Quer Sair (backend spec 0037 / F11). */

export type CancellationReason = "preco" | "nao_uso" | "mudanca" | "insatisfacao" | "outro";
export type SaveOffer = "pause" | "discount" | "downgrade" | "winback_later";

export interface RetentionSettings {
  discountPercent: number;
  discountDurationMonths: number;
  discountEnabled: boolean;
  pauseEnabled: boolean;
}

export interface OpenCancellationResult {
  id: string;
  reason: string | null;
  recommended: SaveOffer;
  message: string;
  suggestedPercent: number;
  suggestedMonths: number;
  settings: RetentionSettings;
  subscription: { id: string; clientName: string; healthBand: string | null };
}

export interface CancellationRequest {
  id: string;
  clientName: string;
  subscriptionId: string;
  reason: string | null;
  status: "open" | "saved" | "cancelled";
  recommended: string | null;
  saveOffer: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

class RetentionService {
  /** Abre o fluxo e devolve a oferta recomendada. */
  async open(subscriptionId: string, reason: CancellationReason): Promise<OpenCancellationResult> {
    const { data } = await api.post("/retention/requests", { subscriptionId, reason });
    return data;
  }

  /** Resolve: salvo (aplica oferta; desconto aceita % e meses) ou cancelado. */
  async resolve(
    id: string,
    outcome: "saved" | "cancelled",
    opts: { offer?: SaveOffer; discountPercent?: number; discountMonths?: number } = {}
  ) {
    const { data } = await api.post(`/retention/requests/${id}/resolve`, { outcome, ...opts });
    return data;
  }

  async list(): Promise<CancellationRequest[]> {
    const { data } = await api.get("/retention/requests");
    return data;
  }

  async getSettings(): Promise<RetentionSettings> {
    const { data } = await api.get("/retention/settings");
    return data;
  }

  async updateSettings(patch: Partial<RetentionSettings>): Promise<RetentionSettings> {
    const { data } = await api.put("/retention/settings", patch);
    return data;
  }
}

export default new RetentionService();
