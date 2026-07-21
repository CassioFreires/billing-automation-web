import React, { useState } from "react";
import { isAxiosError } from "axios";
import {
  Gem,
  Loader2,
  Check,
  Copy,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { usePlan, useCheckout } from "../../hooks/useBilling";
import type { PlanDef, PlanId } from "../../services/billing.service";
import { formatBRL, formatDate } from "../../lib/format";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  trialing: { label: "Período de teste", cls: "text-brand-warning bg-amber-500/10 border-amber-500/20" },
  active: { label: "Ativo", cls: "text-brand-success bg-emerald-500/10 border-emerald-500/20" },
  past_due: { label: "Inadimplente", cls: "text-rose-300 bg-brand-danger/10 border-brand-danger/20" },
  canceled: { label: "Cancelado", cls: "text-text-muted bg-bg-elevated/40 border-border-subtle" },
};

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/** PIX copia-e-cola (mesmo padrão da PayPage). */
const PixBox: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  };
  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 min-w-0 truncate bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-muted font-mono">
        {code}
      </code>
      <button
        onClick={copy}
        className="focus-ring shrink-0 bg-brand-primary hover:bg-brand-hover text-white rounded-xl px-3.5 flex items-center gap-1.5 text-sm font-medium transition-all active:scale-95"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
};

export const PlanPage: React.FC = () => {
  const { data, isLoading } = usePlan();
  const checkout = useCheckout();
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<string | null>(null);

  const onChoose = async (plan: PlanId) => {
    setError(null);
    setPix(null);
    try {
      const res = await checkout.mutateAsync(plan);
      if (res.switched) return; // free: troca imediata (hook invalida a query)
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      if (res.pixCopyPaste) {
        setPix(res.pixCopyPaste);
        return;
      }
      setError("Não foi possível iniciar o pagamento. Tente novamente.");
    } catch (err) {
      setError(apiError(err, "Erro ao trocar de plano."));
    }
  };

  const card = "bg-bg-card border border-border-subtle/80 rounded-2xl p-6";

  return (
    <div className="space-y-6 animate-fade-in mt-12 lg:mt-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
          <Gem className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plano</h1>
          <p className="text-text-muted text-sm">Sua assinatura da Adimplo, uso e upgrade.</p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="h-40 rounded-2xl bg-bg-main/60 animate-pulse" />
      ) : (
        <>
          {/* Plano atual + uso */}
          <div className={`${card} space-y-5`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold capitalize">{data.entitlements.plan}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    (STATUS_META[data.status] ?? STATUS_META.canceled).cls
                  }`}
                >
                  {(STATUS_META[data.status] ?? STATUS_META.canceled).label}
                </span>
              </div>
              {data.status === "trialing" && data.trialEndsAt && (
                <span className="flex items-center gap-1.5 text-sm text-brand-warning">
                  <Clock className="h-4 w-4" />
                  {daysLeft(data.trialEndsAt)} dia(s) de teste restantes
                </span>
              )}
              {data.status === "active" && data.currentPeriodEnd && (
                <span className="text-sm text-text-muted">
                  Renova em {formatDate(data.currentPeriodEnd)}
                </span>
              )}
            </div>

            {/* Barra de uso de faturas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Faturas emitidas neste mês</span>
                <span className="font-medium text-text-main">
                  {data.usage.invoicesThisMonth}
                  {data.usage.maxInvoicesPerMonth === null
                    ? " / ilimitado"
                    : ` / ${data.usage.maxInvoicesPerMonth}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg-main overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    data.usage.overQuota ? "bg-brand-danger" : "bg-brand-primary"
                  }`}
                  style={{
                    width:
                      data.usage.maxInvoicesPerMonth === null
                        ? "12%"
                        : `${Math.min(
                            100,
                            (data.usage.invoicesThisMonth / data.usage.maxInvoicesPerMonth) * 100
                          )}%`,
                  }}
                />
              </div>
            </div>

            {!data.entitlements.canWrite && (
              <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {data.entitlements.reason === "TRIAL_EXPIRED"
                    ? "Seu período de teste terminou. Assine um plano para voltar a emitir cobranças."
                    : "Sua assinatura está pendente. Regularize para voltar a emitir cobranças."}
                </span>
              </div>
            )}
          </div>

          {/* PIX (quando o checkout retorna PIX) */}
          {pix && (
            <div className={`${card} space-y-3`}>
              <div className="flex items-center gap-2 text-brand-success text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Pague via PIX para ativar
              </div>
              <PixBox code={pix} />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tiers */}
          <div className="grid gap-4 md:grid-cols-3">
            {data.catalog.map((p: PlanDef) => {
              const isCurrent = data.entitlements.plan === p.id && data.entitlements.canWrite;
              const isPending = checkout.isPending && checkout.variables === p.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    p.id === "pro"
                      ? "border-brand-primary/60 bg-brand-primary/5"
                      : "border-border-subtle/80 bg-bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">{p.label}</span>
                    {p.id === "pro" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-full px-2 py-0.5">
                        <Sparkles className="h-3 w-3" /> Recomendado
                      </span>
                    )}
                  </div>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {p.priceCents === 0 ? "Grátis" : formatBRL(p.priceCents / 100)}
                    </span>
                    {p.priceCents > 0 && <span className="text-sm text-text-muted">/mês</span>}
                  </div>
                  <ul className="space-y-2 text-sm text-text-muted flex-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-brand-success shrink-0" />
                      {p.maxInvoicesPerMonth === null
                        ? "Faturas ilimitadas"
                        : `Até ${p.maxInvoicesPerMonth} faturas/mês`}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check
                        className={`h-4 w-4 shrink-0 ${
                          p.features.reliefButton ? "text-brand-success" : "text-text-faint"
                        }`}
                      />
                      Botão de Alívio {p.features.reliefButton ? "incluído" : "—"}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check
                        className={`h-4 w-4 shrink-0 ${
                          p.adimploBranding ? "text-text-faint" : "text-brand-success"
                        }`}
                      />
                      {p.adimploBranding ? "Com marca Adimplo" : "Sem marca Adimplo"}
                    </li>
                  </ul>
                  <button
                    onClick={() => onChoose(p.id)}
                    disabled={isCurrent || checkout.isPending}
                    className={`focus-ring mt-5 w-full font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 ${
                      isCurrent
                        ? "border border-border-subtle text-text-muted cursor-default"
                        : "bg-brand-primary hover:bg-brand-hover text-white"
                    }`}
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCurrent ? "Plano atual" : p.priceCents === 0 ? "Mudar para Free" : "Assinar"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-text-faint text-center">
            Pagamento simulado no ambiente de teste. Em produção, use o gateway configurado.
          </p>
        </>
      )}
    </div>
  );
};
