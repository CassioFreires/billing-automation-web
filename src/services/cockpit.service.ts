import api from "./api";

/** Resposta de GET /api/cockpit/overview (backend spec 0017). */
export interface CockpitOverview {
  periodoDias: number;
  kpis: {
    aReceber: number;
    aVencer: number;
    emAtraso: number;
    taxaInadimplencia: number; // 0..1
    recebidoNoPeriodo: number;
  };
  porStatus: { PENDING: number; PAID: number; OVERDUE: number; FAILED: number };
  aging: { aVencer: number; d0a30: number; d31a60: number; d60mais: number };
  acoes: {
    vencemEssaSemana: { invoiceId: string; clientName: string; value: number; dueDate: string }[];
    hesitando: { invoiceId: string; clientName: string; value: number; opens: number }[];
  };
}

export class CockpitService {
  /** Painel do dono: KPIs, aging e fila de ações. `days` = janela de recebidos. */
  async getOverview(days = 30): Promise<CockpitOverview> {
    const response = await api.get("/cockpit/overview", { params: { days } });
    return response.data;
  }
}

export default new CockpitService();
