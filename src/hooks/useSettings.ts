import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import settingsService from "../services/settings.service";
import type { PaymentSettings, WhatsappSettingsInput } from "../services/settings.service";

const PAYMENT_KEY = ["settings", "payment"];
const WHATSAPP_KEY = ["settings", "whatsapp"];

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

export function useWhatsappSettings() {
  return useQuery({ queryKey: WHATSAPP_KEY, queryFn: () => settingsService.getWhatsapp() });
}

export function useUpdateWhatsappSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WhatsappSettingsInput) => settingsService.updateWhatsapp(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: WHATSAPP_KEY }),
  });
}
