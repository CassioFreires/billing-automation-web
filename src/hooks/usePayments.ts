import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import paymentService from "../services/payments.service";
import type { RegisterPaymentInput } from "../services/payments.service";

const KEY = "payments";

/** Lista os recebimentos de uma fatura (GET /invoices/:id/payments). */
export function usePayments(invoiceId: string | null) {
  return useQuery({
    queryKey: [KEY, invoiceId],
    queryFn: () => paymentService.list(invoiceId as string),
    enabled: !!invoiceId,
  });
}

/** Baixa manual (POST /invoices/:id/payments). Invalida faturas e recebimentos. */
export function useRegisterPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, input }: { invoiceId: string; input: RegisterPaymentInput }) =>
      paymentService.register(invoiceId, input),
    onSuccess: (_data, { invoiceId }) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: [KEY, invoiceId] });
    },
  });
}
