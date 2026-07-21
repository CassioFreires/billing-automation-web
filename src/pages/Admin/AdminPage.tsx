import React, { useState } from "react";
import { isAxiosError } from "axios";
import {
  Shield,
  Search,
  Loader2,
  Ban,
  CheckCircle2,
  Gem,
  LogIn,
  AlertCircle,
  Users,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useAdminMetrics, useAdminTenants, useAdminActions } from "../../hooks/useAdmin";
import type { AdminTenantRow } from "../../services/admin.service";
import type { PlanId } from "../../services/billing.service";
import { Modal } from "../../components/ui/Modal";
import { impersonation } from "../../lib/token";
import { formatBRL, formatDate } from "../../lib/format";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  return fallback;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  trialing: { label: "Teste", cls: "text-brand-warning bg-amber-500/10 border-amber-500/20" },
  active: { label: "Ativo", cls: "text-brand-success bg-emerald-500/10 border-emerald-500/20" },
  past_due: { label: "Inadimplente", cls: "text-rose-300 bg-brand-danger/10 border-brand-danger/20" },
  canceled: { label: "Cancelado", cls: "text-text-muted bg-bg-elevated/40 border-border-subtle" },
};

const PLANS: PlanId[] = ["free", "essencial", "pro"];

const MetricCard: React.FC<{ icon: React.ElementType; label: string; value: string; accent?: string }> = ({
  icon: Icon,
  label,
  value,
  accent = "text-brand-primary",
}) => (
  <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-5">
    <div className={`flex items-center gap-2 text-xs font-medium ${accent} mb-2`}>
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <div className="text-2xl font-extrabold tracking-tight">{value}</div>
  </div>
);

export const AdminPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: metrics } = useAdminMetrics();
  const { data: tenantsData, isLoading } = useAdminTenants(search, page);
  const { suspend, activate, changePlan, impersonate } = useAdminActions();

  const [planModal, setPlanModal] = useState<AdminTenantRow | null>(null);
  const [planChoice, setPlanChoice] = useState<PlanId>("pro");
  const [error, setError] = useState<string | null>(null);

  const doImpersonate = async (t: AdminTenantRow) => {
    setError(null);
    try {
      const { token } = await impersonate.mutateAsync(t.id);
      impersonation.start(token, t.name);
      window.location.href = "/dashboard"; // recarrega como o tenant
    } catch (err) {
      setError(apiError(err, "Não foi possível impersonar."));
    }
  };

  const applyPlan = async () => {
    if (!planModal) return;
    setError(null);
    try {
      await changePlan.mutateAsync({ id: planModal.id, plan: planChoice });
      setPlanModal(null);
    } catch (err) {
      setError(apiError(err, "Não foi possível mudar o plano."));
    }
  };

  const badge = (status: string) => STATUS_META[status] ?? STATUS_META.canceled;

  return (
    <div className="space-y-6 animate-fade-in mt-12 lg:mt-0">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin da plataforma</h1>
          <p className="text-text-muted text-sm">Visão de todos os tenants, métricas e suporte.</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={TrendingUp} label="MRR" value={metrics ? formatBRL(metrics.mrrCents / 100) : "—"} accent="text-brand-success" />
        <MetricCard icon={Users} label="Tenants" value={metrics ? String(metrics.totalTenants) : "—"} />
        <MetricCard icon={CheckCircle2} label="Ativos" value={metrics ? String(metrics.byStatus.active ?? 0) : "—"} accent="text-brand-success" />
        <MetricCard icon={AlertCircle} label="Trials expirando (7d)" value={metrics ? String(metrics.trialsExpiringSoon) : "—"} accent="text-brand-warning" />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar tenant por nome…"
          className="focus-ring w-full bg-bg-card border border-border-subtle rounded-xl pl-9 pr-3 py-2.5 text-sm"
        />
      </div>

      {/* Tabela */}
      <div className="bg-bg-card border border-border-subtle/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Uso</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-primary mx-auto" />
                  </td>
                </tr>
              ) : (
                tenantsData?.tenants.map((t) => {
                  const suspended = t.accountStatus === "SUSPENDED";
                  const b = badge(t.status);
                  return (
                    <tr key={t.id} className="border-b border-border-subtle/50 hover:bg-bg-elevated/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-text-faint">desde {formatDate(t.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">{t.plan}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${b.cls}`}>{b.label}</span>
                        {suspended && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium border text-rose-300 bg-brand-danger/10 border-brand-danger/20">
                            Suspenso
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{t.counts.clients}</span>
                        <span className="inline-flex items-center gap-1 ml-2"><Receipt className="h-3 w-3" />{t.counts.invoices}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setPlanModal(t); setPlanChoice((t.plan as PlanId) ?? "pro"); }}
                            className="focus-ring p-1.5 rounded-lg text-text-muted hover:text-brand-primary hover:bg-bg-elevated/50"
                            title="Mudar plano"
                          >
                            <Gem className="h-4 w-4" />
                          </button>
                          {suspended ? (
                            <button
                              onClick={() => activate.mutate(t.id)}
                              disabled={activate.isPending}
                              className="focus-ring p-1.5 rounded-lg text-brand-success hover:bg-emerald-500/10"
                              title="Reativar"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => suspend.mutate(t.id)}
                              disabled={suspend.isPending}
                              className="focus-ring p-1.5 rounded-lg text-rose-300 hover:bg-brand-danger/10"
                              title="Suspender"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => doImpersonate(t)}
                            disabled={impersonate.isPending}
                            className="focus-ring p-1.5 rounded-lg text-text-muted hover:text-brand-primary hover:bg-bg-elevated/50"
                            title="Entrar como (suporte)"
                          >
                            <LogIn className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!isLoading && tenantsData?.tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted text-sm">
                    Nenhum tenant encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: mudar plano */}
      <Modal open={Boolean(planModal)} onClose={() => setPlanModal(null)} title={`Mudar plano — ${planModal?.name ?? ""}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            {PLANS.map((p) => (
              <label
                key={p}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  planChoice === p ? "border-brand-primary bg-brand-primary/5" : "border-border-subtle hover:bg-bg-elevated/30"
                }`}
              >
                <input type="radio" name="plan" className="accent-brand-primary" checked={planChoice === p} onChange={() => setPlanChoice(p)} />
                <span className="text-sm font-medium capitalize">{p}</span>
              </label>
            ))}
          </div>
          <button
            onClick={applyPlan}
            disabled={changePlan.isPending}
            className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {changePlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Aplicar plano
          </button>
        </div>
      </Modal>
    </div>
  );
};
