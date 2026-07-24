import { useMutation, useQueryClient } from "@tanstack/react-query";
import retentionService, {
  type CancellationReason,
  type SaveOffer,
} from "../services/retention.service";

/** Abre o fluxo de retenção para uma assinatura (F11). */
export function useOpenCancellation() {
  return useMutation({
    mutationFn: ({ subscriptionId, reason }: { subscriptionId: string; reason: CancellationReason }) =>
      retentionService.open(subscriptionId, reason),
  });
}

/** Resolve o pedido (salvo/cancelado) e revalida as assinaturas. */
export function useResolveCancellation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, outcome, offer }: { id: string; outcome: "saved" | "cancelled"; offer?: SaveOffer }) =>
      retentionService.resolve(id, outcome, offer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}
