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

export interface PortalContract {
  title: string;
  body: string;
  version: number;
  accepted: boolean;
  acceptedAt: string | null;
}

export interface PortalView {
  clientName: string;
  open: PortalInvoice[];
  history: PortalInvoice[];
  totals: { openCount: number; openValue: number };
  contract: PortalContract | null; // Contrato no Celular (spec 0040)
}

class PortalService {
  /** Público (sem token de auth): visão do pagador. */
  async getByToken(token: string): Promise<PortalView> {
    const { data } = await api.get(`/public/portal/${token}`);
    return data;
  }

  /** Aceite do contrato no Portal (spec 0040) — público. */
  async acceptContract(token: string, name: string, document?: string) {
    const { data } = await api.post(`/public/portal/${token}/contract/accept`, { name, document });
    return data as { accepted: boolean; version: number; acceptedAt: string };
  }

  /** Ação do dono: gera/recupera o link do portal de um cliente. */
  async getPortalLink(clientId: string): Promise<string> {
    const { data } = await api.get(`/clients/${clientId}/portal-link`);
    return data.url;
  }
}

export default new PortalService();
