import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientService from "../services/clientes.service";
import type { ClientInput, ImportClientRow } from "../services/clientes.service";

const KEY = ["clients"];

export function useClients() {
  return useQuery({ queryKey: KEY, queryFn: () => clientService.findAll() });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientInput) => clientService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useImportClients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clients: ImportClientRow[]) => clientService.import(clients),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientInput> }) =>
      clientService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
