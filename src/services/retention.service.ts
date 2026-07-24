import api from "./api";

/** Segura Quem Quer Sair (backend spec 0037 / F11). */

export type CancellationReason = "preco" | "nao_uso" | "mudanca" | "insatisfacao" | "outro";
export type SaveOffer = "pause" | "discount" | "downgrade" | "winback_later";

export interface OpenCancellationResult {
  id: string;
  reason: string | null;
  recommended: SaveOffer;
  message: string;
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

  /** Resolve: salvo (aplica oferta) ou cancelado. */
  async resolve(id: string, outcome: "saved" | "cancelled", offer?: SaveOffer) {
    const { data } = await api.post(`/retention/requests/${id}/resolve`, { outcome, offer });
    return data;
  }

  async list(): Promise<CancellationRequest[]> {
    const { data } = await api.get("/retention/requests");
    return data;
  }
}

export default new RetentionService();
