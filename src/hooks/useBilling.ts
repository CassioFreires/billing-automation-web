import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import billingService from "../services/billing.service";
import type { PlanId } from "../services/billing.service";

const PLAN_KEY = ["billing", "plan"];

export function usePlan() {
  return useQuery({ queryKey: PLAN_KEY, queryFn: () => billingService.getPlan() });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: PlanId) => billingService.checkout(plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_KEY }),
  });
}
