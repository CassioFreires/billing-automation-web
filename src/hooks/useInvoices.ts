import { useQuery } from "@tanstack/react-query";
import { InvoiceService } from "../services/invoices.service";

const invoiceService = new InvoiceService();

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: string;
}

/** Lista faturas do tenant (GET /invoices). Retorna { invoices, meta }. */
export function useInvoices(params: InvoiceListParams = {}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoiceService.findAll(params),
    placeholderData: (previous) => previous,
  });
}
