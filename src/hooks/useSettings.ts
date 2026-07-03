import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import settingsService from "../services/settings.service";
import type { PaymentSettings } from "../services/settings.service";

const PAYMENT_KEY = ["settings", "payment"];

export function usePaymentSettings() {
  return useQuery({ queryKey: PAYMENT_KEY, queryFn: () => settingsService.getPayment() });
}

export function useUpdatePaymentSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentSettings) => settingsService.updatePayment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAYMENT_KEY }),
  });
}
