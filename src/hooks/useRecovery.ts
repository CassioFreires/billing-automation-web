import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import recoveryService from "../services/recovery.service";

const KEY = ["recovery", "cases"];

/** Lista os casos de recuperação do tenant (GET /recovery/cases). */
export function useRecoveryCases() {
  return useQuery({ queryKey: KEY, queryFn: () => recoveryService.listCases() });
}

/** Detalhe de um caso (só busca quando `enabled`, ex.: ao expandir a linha). */
export function useRecoveryCase(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["recovery", "case", id],
    queryFn: () => recoveryService.getCase(id),
    enabled,
  });
}

/** Encerramento manual do caso; invalida a lista ao concluir. */
export function useCloseRecoveryCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recoveryService.closeCase(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
