import api from "./api";

/**
 * Autonegociação (spec 0018 — M2). Rotas PÚBLICAS: a página do devedor não tem
 * login; o tenant é resolvido pela fatura (linkToken). Usa a mesma instância
 * `api` — sem token no localStorage, nenhum header Authorization é enviado.
 */

export type AgreementOptionType = "discount" | "installments" | "defer";

export interface AgreementOption {
  type: AgreementOptionType;
  finalValue: number;
  discountPercent?: number;
  installments?: number;
  installmentValue?: number;
  newDueDate?: string;
  feePercent?: number;
}

export interface AgreementInvoiceInfo {
  value: number;
  dueDate: string;
  status: string;
  checkoutUrl: string | null;
  pixCopyPaste: string | null;
}

export interface AgreementNewInvoice {
  id: string;
  value: number;
  dueDate: string;
  linkToken: string | null;
  checkoutUrl: string | null;
  pixCopyPaste: string | null;
}

export interface ActiveAgreement {
  id: string;
  type: AgreementOptionType;
  status: string;
  terms: Record<string, unknown>;
  newInvoice: AgreementNewInvoice | null;
}

export interface AgreementOptionsResponse {
  invoice: AgreementInvoiceInfo;
  opens: number;
  hesitating: boolean;
  reliefAvailable: boolean;
  options: AgreementOption[];
  activeAgreement: ActiveAgreement | null;
}

export interface AcceptAgreementResponse {
  id: string;
  type: AgreementOptionType;
  status: string;
  terms: Record<string, unknown>;
  newInvoice: AgreementNewInvoice;
}

export interface PayAttemptResponse {
  checkoutUrl: string | null;
  pixCopyPaste: string | null;
}

class AgreementsService {
  async getOptions(token: string): Promise<AgreementOptionsResponse> {
    const { data } = await api.get(`/public/agreements/${token}/options`);
    return data;
  }

  async accept(
    token: string,
    body: { type: AgreementOptionType; installments?: number }
  ): Promise<AcceptAgreementResponse> {
    const { data } = await api.post(`/public/agreements/${token}/accept`, body);
    return data;
  }

  async payAttempt(token: string): Promise<PayAttemptResponse> {
    const { data } = await api.post(`/public/agreements/${token}/pay-attempt`, {});
    return data;
  }
}

export default new AgreementsService();
