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
