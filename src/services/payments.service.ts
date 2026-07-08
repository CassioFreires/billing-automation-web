import api from "./api";
import type { Invoice } from "./invoices.service";

/** Meios de pagamento aceitos na baixa manual (backend: spec 0015). */
export const PAYMENT_METHODS = ["pix", "dinheiro", "transferencia", "cartao", "boleto", "outro"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  cartao: "Cartão",
  boleto: "Boleto",
  outro: "Outro",
};

/** Um recebimento (o dinheiro que entrou para quitar a fatura). */
export interface Payment {
  id: string;
  amount: number;
  method?: string | null;
  source: string; // manual | gateway
  paidAt: string;
  note?: string | null;
  receiptUrl?: string | null;
  createdAt?: string;
  invoiceId: string;
}

/** Corpo da baixa manual. `amount`/`paidAt` são opcionais (default = valor total / agora). */
export interface RegisterPaymentInput {
  method: PaymentMethod;
  amount?: number;
  paidAt?: string; // ISO
  note?: string;
  receiptUrl?: string;
}

export class PaymentService {
  /** GET /api/invoices/:id/payments */
  async list(invoiceId: string): Promise<Payment[]> {
    const { data } = await api.get(`/invoices/${invoiceId}/payments`);
    return data.payments ?? [];
  }

  /** POST /api/invoices/:id/payments — baixa manual; devolve o pagamento e a fatura quitada. */
  async register(invoiceId: string, input: RegisterPaymentInput): Promise<{ payment: Payment; invoice: Invoice }> {
    const { data } = await api.post(`/invoices/${invoiceId}/payments`, input);
    return data;
  }
}

export default new PaymentService();
