import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import settingsService from "../services/settings.service";
import type {
  PaymentSettings,
  WhatsappSettingsInput,
  NegotiationSettings,
  ReguaSettings,
  ChannelSettings,
} from "../services/settings.service";

const PAYMENT_KEY = ["settings", "payment"];
const WHATSAPP_KEY = ["settings", "whatsapp"];
const NEGOTIATION_KEY = ["settings", "negotiation"];
const REGUA_KEY = ["settings", "regua"];
const CHANNEL_KEY = ["settings", "channel"];

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

export function useNegotiationSettings() {
  return useQuery({ queryKey: NEGOTIATION_KEY, queryFn: () => settingsService.getNegotiation() });
}

export function useUpdateNegotiationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NegotiationSettings) => settingsService.updateNegotiation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: NEGOTIATION_KEY }),
  });
}

export function useReguaSettings() {
  return useQuery({ queryKey: REGUA_KEY, queryFn: () => settingsService.getRegua() });
}

export function useUpdateReguaSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReguaSettings) => settingsService.updateRegua(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: REGUA_KEY }),
  });
}

export function useChannelSettings() {
  return useQuery({ queryKey: CHANNEL_KEY, queryFn: () => settingsService.getChannel() });
}

export function useUpdateChannelSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChannelSettings) => settingsService.updateChannel(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHANNEL_KEY }),
  });
}
