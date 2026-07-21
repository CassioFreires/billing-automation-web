import consoleApi from "./consoleApi";
import type { PlanId } from "./billing.service";

/** Console da plataforma (spec 0031). Usa a sessão do console (não a do tenant). */
export interface AdminMetrics {
  totalTenants: number;
  byStatus: Record<string, number>;
  mrrCents: number;
  trialsExpiringSoon: number;
}

export interface AdminTenantRow {
  id: string;
  name: string;
  accountStatus: string; // ACTIVE | SUSPENDED
  createdAt: string;
  plan: string;
  status: string; // trialing | active | past_due | canceled
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  canWrite: boolean;
  counts: { clients: number; invoices: number; users: number };
}

export interface AdminTenantsResponse {
  tenants: AdminTenantRow[];
  total: number;
  page: number;
  limit: number;
}

class AdminService {
  async getMe(): Promise<{ isPlatformAdmin: boolean; email: string }> {
    const { data } = await consoleApi.get("/admin/me");
    return data;
  }

  async getMetrics(): Promise<AdminMetrics> {
    const { data } = await consoleApi.get("/admin/metrics");
    return data;
  }

  async getTenants(search?: string, page = 1): Promise<AdminTenantsResponse> {
    const { data } = await consoleApi.get("/admin/tenants", { params: { search, page } });
    return data;
  }

  async suspend(id: string): Promise<void> {
    await consoleApi.post(`/admin/tenants/${id}/suspend`);
  }

  async activate(id: string): Promise<void> {
    await consoleApi.post(`/admin/tenants/${id}/activate`);
  }

  async changePlan(id: string, plan: PlanId): Promise<void> {
    await consoleApi.post(`/admin/tenants/${id}/plan`, { plan });
  }

  async impersonate(id: string): Promise<{ token: string; expiresIn: string }> {
    const { data } = await consoleApi.post(`/admin/tenants/${id}/impersonate`);
    return data;
  }
}

export default new AdminService();
