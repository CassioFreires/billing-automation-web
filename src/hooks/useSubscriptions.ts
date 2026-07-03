import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import subscriptionService from "../services/subscriptions.service";
import type {
  SubscriptionInput,
  SubscriptionUpdate,
} from "../services/subscriptions.service";

const KEY = ["subscriptions"];

export function useSubscriptions() {
  return useQuery({ queryKey: KEY, queryFn: () => subscriptionService.findAll() });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscriptionInput) => subscriptionService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubscriptionUpdate }) =>
      subscriptionService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRunSubscriptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionService.run(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
