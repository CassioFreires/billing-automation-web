import api from "./api";

/** Loja no Pagamento (backend spec 0044 / F15). */

export type OfferType = "addon" | "upgrade" | "produto";

export interface Offer {
  id: string;
  name: string;
  priceCents: number;
  type: OfferType;
  active: boolean;
}

export interface OfferSummary {
  activeOffers: number;
  purchases: number;
  paidPurchases: number;
  revenueCents: number;
}

/** Item da vitrine pública (checkout) — sem dados sensíveis. */
export interface PublicOffer {
  id: string;
  name: string;
  priceCents: number;
  type: OfferType;
}

export interface OfferAddonInvoice {
  id: string;
  value: number;
  dueDate: string;
  checkoutUrl: string | null;
  pixCopyPaste: string | null;
}

class OffersService {
  // --- Dono (JWT) ---
  async list(): Promise<Offer[]> {
    const { data } = await api.get("/offers");
    return data;
  }
  async summary(): Promise<OfferSummary> {
    const { data } = await api.get("/offers/summary");
    return data;
  }
  async create(body: { name: string; priceCents: number; type?: OfferType; active?: boolean }): Promise<Offer> {
    const { data } = await api.post("/offers", body);
    return data;
  }
  async update(id: string, body: Partial<{ name: string; priceCents: number; type: OfferType; active: boolean }>): Promise<Offer> {
    const { data } = await api.put(`/offers/${id}`, body);
    return data;
  }
  async remove(id: string): Promise<void> {
    await api.delete(`/offers/${id}`);
  }

  // --- Público (checkout do Elo) ---
  async listForToken(token: string): Promise<PublicOffer[]> {
    const { data } = await api.get(`/public/offers/${token}`);
    return data;
  }
  async accept(token: string, offerId: string): Promise<{ newInvoice: OfferAddonInvoice }> {
    const { data } = await api.post(`/public/offers/${token}/accept`, { offerId });
    return data;
  }
}

export default new OffersService();
