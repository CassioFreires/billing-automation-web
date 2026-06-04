import { useQuery } from "@tanstack/react-query";
import { InvoiceService } from "../services/invoices.service";

const invoiceService = new InvoiceService();

export function useInvoiceOverdue(page: number = 1, limit: number = 10) {
  return useQuery({
    // IMPORTANTE: Adicionar page e limit na queryKey faz o React Query 
    // buscar novos dados automaticamente sempre que a página mudar.
    queryKey: ["pending-invoices", { page, limit }],
    
    queryFn: () => invoiceService.findPendingInvoices(page, limit),
    
    staleTime: 1000 * 60 * 5, // 5 minutos
    
    // UI/UX de alto nível: Mantém os dados da página anterior visíveis 
    // enquanto os dados da nova página estão carregando no background.
    placeholderData: (previousData) => previousData, 
  });
}