import api from "./api";

/** Onboarding guiado do tenant (spec 0021). */
export type OnboardingStepKey = "gateway" | "whatsapp" | "client" | "invoice";

export interface OnboardingStep {
  key: OnboardingStepKey;
  title: string;
  description: string;
  done: boolean;
  optional: boolean;
  skipped?: boolean;
  cta: { label: string; to: string };
}

export interface OnboardingStatus {
  completed: boolean;
  dismissed: boolean;
  progress: { done: number; total: number };
  steps: OnboardingStep[];
}

export interface OnboardingUpdate {
  dismiss?: boolean;
  skipWhatsapp?: boolean;
}

class OnboardingService {
  async getStatus(): Promise<OnboardingStatus> {
    const response = await api.get("/onboarding");
    return response.data;
  }

  async update(data: OnboardingUpdate): Promise<OnboardingStatus> {
    const response = await api.patch("/onboarding", data);
    return response.data;
  }
}

export default new OnboardingService();
