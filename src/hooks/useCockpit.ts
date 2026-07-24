import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import cockpitService from "../services/cockpit.service";
import notificationService from "../services/notification.service";

/** Painel do Cockpit (GET /cockpit/overview). `days` = janela dos recebidos. */
export function useCockpit(days = 30) {
  return useQuery({
    queryKey: ["cockpit", days],
    queryFn: () => cockpitService.getOverview(days),
    placeholderData: (previous) => previous,
  });
}

/** Lista do Dia (GET /cockpit/actions) — fila priorizada por dinheiro em risco (F3). */
export function useDailyActions() {
  return useQuery({
    queryKey: ["cockpit", "actions"],
    queryFn: () => cockpitService.getActions(),
    placeholderData: (previous) => previous,
  });
}

/** Previsão de caixa (GET /cockpit/forecast) — projeção por semana (F4). */
export function useForecast(days = 30) {
  return useQuery({
    queryKey: ["cockpit", "forecast", days],
    queryFn: () => cockpitService.getForecast(days),
    placeholderData: (previous) => previous,
  });
}

/** Ação "Cobrar agora": enfileira a cobrança da fatura e revalida a fila. */
export function useTriggerCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => notificationService.triggerByInvoice(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cockpit", "actions"] });
    },
  });
}
