import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import contractService, { type ContractSettings } from "../services/contract.service";

/** Config do contrato do tenant (spec 0040). */
export function useContractSettings() {
  return useQuery({
    queryKey: ["contract", "settings"],
    queryFn: () => contractService.getSettings(),
  });
}

export function useUpdateContractSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ContractSettings>) => contractService.updateSettings(patch),
    onSuccess: (data) => qc.setQueryData(["contract", "settings"], data),
  });
}

/** Upload do PDF do contrato (spec 0041). */
export function useUploadContractFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => contractService.uploadFile(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", "settings"] }),
  });
}
