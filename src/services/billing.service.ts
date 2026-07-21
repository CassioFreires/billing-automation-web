import api from "./api";

/** Cobrança do próprio SaaS (spec 0020). */
export type PlanId = "free" | "essencial" | "pro";

export interface PlanFeatures {
  reliefButton: boolean;
}

export interface PlanDef {
  id: PlanId;
  label: string;
  priceCents: number;
  maxInvoicesPerMonth: number | null;
  features: PlanFeatures;
  adimploBranding: boolean;
}

export interface Entitlements {
  plan: PlanId;
  canWrite: boolean;
  maxInvoicesPerMonth: number | null;
  features: PlanFeatures;
  reason?: "TRIAL_EXPIRED" | "PLAN_EXPIRED";
}

export interface PlanStatus {
  plan: string;
  status: string; // trialing | active | past_due | canceled
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  entitlements: Entitlements;
  usage: {
    invoicesThisMonth: number;
    maxInvoicesPerMonth: number | null;
    overQuota: boolean;
  };
  catalog: PlanDef[];
}

export interface CheckoutResponse {
  switched?: boolean;
  platformInvoiceId?: string;
  checkoutUrl?: string | null;
  pixCopyPaste?: string | null;
}

class BillingService {
  async getPlan(): Promise<PlanStatus> {
    const response = await api.get("/billing/plan");
    return response.data;
  }

  async checkout(plan: PlanId): Promise<CheckoutResponse> {
    const response = await api.post("/billing/checkout", { plan });
    return response.data;
  }
}

export default new BillingService();
