import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import invoiceService from "../services/invoices.service";
import type { InvoiceInput } from "../services/invoices.service";
import notificationService from "../services/notification.service";

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: string;
}

const KEY = "invoices";

/** Lista faturas do tenant (GET /invoices). Retorna { invoices, meta }. */
export function useInvoices(params: InvoiceListParams = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => invoiceService.findAll(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceInput) => invoiceService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** Enfileira a cobrança de uma fatura (dispara a régua). */
export function useTriggerNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => notificationService.triggerByInvoice(invoiceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
