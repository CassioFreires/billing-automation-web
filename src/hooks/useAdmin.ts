import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminService from "../services/admin.service";
import type { PlanId } from "../services/billing.service";

const ME_KEY = ["admin", "me"];
const METRICS_KEY = ["admin", "metrics"];
const TENANTS_KEY = ["admin", "tenants"];

/** É admin? 403 vira erro → tratamos como "não admin". retry:false evita loop. */
export function useAdminMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => adminService.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminMetrics(enabled = true) {
  return useQuery({ queryKey: METRICS_KEY, queryFn: () => adminService.getMetrics(), enabled });
}

export function useAdminTenants(search: string, page: number, enabled = true) {
  return useQuery({
    queryKey: [...TENANTS_KEY, search, page],
    queryFn: () => adminService.getTenants(search, page),
    enabled,
  });
}

export function useAdminActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: TENANTS_KEY });
    qc.invalidateQueries({ queryKey: METRICS_KEY });
  };
  return {
    suspend: useMutation({ mutationFn: (id: string) => adminService.suspend(id), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: (id: string) => adminService.activate(id), onSuccess: invalidate }),
    changePlan: useMutation({
      mutationFn: (v: { id: string; plan: PlanId }) => adminService.changePlan(v.id, v.plan),
      onSuccess: invalidate,
    }),
    impersonate: useMutation({ mutationFn: (id: string) => adminService.impersonate(id) }),
  };
}
