import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import accessService, { type AccessSettings, type AccessOverride } from "../services/access.service";

/** Config de controle de acesso (spec 0042). */
export function useAccessSettings() {
  return useQuery({ queryKey: ["access", "settings"], queryFn: () => accessService.getSettings() });
}

export function useUpdateAccessSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AccessSettings>) => accessService.updateSettings(patch),
    onSuccess: (data) => {
      qc.setQueryData(["access", "settings"], data);
      qc.invalidateQueries({ queryKey: ["access", "clients"] });
    },
  });
}

/** Estado de acesso de todos os clientes (derivado). */
export function useClientsAccess() {
  return useQuery({ queryKey: ["access", "clients"], queryFn: () => accessService.listClients() });
}

export function useSetAccessOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, override }: { clientId: string; override: AccessOverride }) =>
      accessService.setOverride(clientId, override),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access", "clients"] }),
  });
}

/** Conexão IoT/Catracas (spec 0043). Integração (API key + webhook) e log de eventos. */
export function useAccessIntegration() {
  return useQuery({ queryKey: ["access", "integration"], queryFn: () => accessService.getIntegration() });
}

export function useSetIntegrationEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => accessService.setIntegrationEnabled(enabled),
    onSuccess: (data) => qc.setQueryData(["access", "integration"], data),
  });
}

export function useRotateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => accessService.rotateApiKey(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access", "integration"] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => accessService.revokeApiKey(),
    onSuccess: (data) => qc.setQueryData(["access", "integration"], data),
  });
}

export function useSetWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (webhookUrl: string) => accessService.setWebhook(webhookUrl),
    onSuccess: (data) => qc.setQueryData(["access", "integration"], data),
  });
}

export function useClearWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => accessService.clearWebhook(),
    onSuccess: (data) => qc.setQueryData(["access", "integration"], data),
  });
}

export function useTestWebhook() {
  return useMutation({ mutationFn: () => accessService.testWebhook() });
}

export function useAccessEvents(limit = 50) {
  return useQuery({ queryKey: ["access", "events", limit], queryFn: () => accessService.listEvents(limit) });
}
