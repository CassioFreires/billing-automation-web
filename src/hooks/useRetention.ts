import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import retentionService, {
  type CancellationReason,
  type SaveOffer,
  type RetentionSettings,
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
    mutationFn: ({
      id,
      outcome,
      offer,
      discountPercent,
      discountMonths,
    }: {
      id: string;
      outcome: "saved" | "cancelled";
      offer?: SaveOffer;
      discountPercent?: number;
      discountMonths?: number;
    }) => retentionService.resolve(id, outcome, { offer, discountPercent, discountMonths }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

/** Config de retenção do tenant (spec 0038). */
export function useRetentionSettings() {
  return useQuery({
    queryKey: ["retention", "settings"],
    queryFn: () => retentionService.getSettings(),
  });
}

export function useUpdateRetentionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<RetentionSettings>) => retentionService.updateSettings(patch),
    onSuccess: (data) => {
      qc.setQueryData(["retention", "settings"], data);
    },
  });
}
