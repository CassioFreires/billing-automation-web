import api from "./api";

/** Portal do pagador (spec 0027) — visão pública por token. */
export interface PortalInvoice {
  id: string;
  value: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  payUrl: string | null;
}

export interface PortalView {
  clientName: string;
  open: PortalInvoice[];
  history: PortalInvoice[];
  totals: { openCount: number; openValue: number };
}

class PortalService {
  /** Público (sem token de auth): visão do pagador. */
  async getByToken(token: string): Promise<PortalView> {
    const { data } = await api.get(`/public/portal/${token}`);
    return data;
  }

  /** Ação do dono: gera/recupera o link do portal de um cliente. */
  async getPortalLink(clientId: string): Promise<string> {
    const { data } = await api.get(`/clients/${clientId}/portal-link`);
    return data.url;
  }
}

export default new PortalService();
