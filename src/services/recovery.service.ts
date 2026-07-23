import api from "./api";

/** Casos de recuperação de pagamento falho (backend spec 0033, F1). */
export type RecoveryStatus = "open" | "recovering" | "recovered" | "lost" | "cancelled";

export interface RecoveryCaseSummary {
  id: string;
  status: RecoveryStatus;
  reason: string;
  amountAtRisk: number;
  currentStep: number;
  reliefOffered: boolean;
  nextActionAt: string | null;
  openedAt: string;
  resolvedAt: string | null;
  outcome: string | null;
  invoiceId: string;
  clientName: string;
  invoiceValue: number;
  dueDate: string;
}

export interface RecoveryAttempt {
  step: number;
  channel: string | null;
  action: string;
  result: string | null;
  occurredAt: string;
}

export interface RecoveryCaseDetail extends RecoveryCaseSummary {
  lastChannel: string | null;
  clientPhone: string;
  attempts: RecoveryAttempt[];
}

export class RecoveryService {
  /** Lista os casos do tenant (GET /recovery/cases). */
  async listCases(): Promise<RecoveryCaseSummary[]> {
    const { data } = await api.get("/recovery/cases");
    return data;
  }

  /** Detalhe de um caso, com a timeline de tentativas. */
  async getCase(id: string): Promise<RecoveryCaseDetail> {
    const { data } = await api.get(`/recovery/cases/${id}`);
    return data;
  }

  /** Encerramento manual pelo dono. */
  async closeCase(id: string): Promise<{ id: string; status: string; outcome: string }> {
    const { data } = await api.post(`/recovery/cases/${id}/close`);
    return data;
  }
}

export default new RecoveryService();
