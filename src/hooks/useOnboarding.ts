import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import onboardingService from "../services/onboarding.service";
import type { OnboardingUpdate } from "../services/onboarding.service";

const ONBOARDING_KEY = ["onboarding"];

export function useOnboarding() {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: () => onboardingService.getStatus(),
  });
}

export function useUpdateOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingUpdate) => onboardingService.update(data),
    onSuccess: (status) => qc.setQueryData(ONBOARDING_KEY, status),
  });
}
