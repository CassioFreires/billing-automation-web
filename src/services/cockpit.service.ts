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
    recuperadoNoPeriodo: number; // pagos após o vencimento (spec 0025)
  };
  porStatus: { PENDING: number; PAID: number; OVERDUE: number; FAILED: number };
  aging: { aVencer: number; d0a30: number; d31a60: number; d60mais: number };
  acoes: {
    vencemEssaSemana: { invoiceId: string; clientName: string; value: number; dueDate: string }[];
    hesitando: { invoiceId: string; clientName: string; value: number; opens: number }[];
  };
}

/** Item da Lista do Dia (GET /api/cockpit/actions — backend spec 0036/F3). */
export interface ActionItem {
  invoiceId: string;
  clientName: string;
  value: number;
  dueDate: string;
  kind: "recuperar" | "cobrar" | "a_vencer";
  band: string | null;
  diasAtraso: number;
  motivo: string;
  priority: number;
}

export interface DailyActions {
  geradoEm: string;
  total: number;
  mostrando: number;
  itens: ActionItem[];
}

/** Previsão de caixa (GET /api/cockpit/forecast — backend spec 0039/F4). */
export interface CashflowBucket {
  de: string;
  ate: string;
  label: string;
  esperado: number;
  provavel: number;
}
export interface CashflowForecast {
  geradoEm: string;
  dias: number;
  total: { esperado: number; provavel: number; confianca: number };
  baldes: CashflowBucket[];
}

export class CockpitService {
  /** Painel do dono: KPIs, aging e fila de ações. `days` = janela de recebidos. */
  async getOverview(days = 30): Promise<CockpitOverview> {
    const response = await api.get("/cockpit/overview", { params: { days } });
    return response.data;
  }

  /** Lista do Dia: fila de ação priorizada por dinheiro em risco (F3). */
  async getActions(): Promise<DailyActions> {
    const response = await api.get("/cockpit/actions");
    return response.data;
  }

  /** Previsão de caixa: projeção de entrada por semana (F4). */
  async getForecast(days = 30): Promise<CashflowForecast> {
    const response = await api.get("/cockpit/forecast", { params: { days } });
    return response.data;
  }
}

export default new CockpitService();
