import React from "react";
import { Link } from "react-router-dom";
import { Check, Rocket, X, ArrowRight } from "lucide-react";
import { useOnboarding, useUpdateOnboarding } from "../../hooks/useOnboarding";
import { impersonation } from "../../lib/token";

/**
 * Checklist de ativação (spec 0021), exibido no topo do Dashboard para contas
 * novas. Some sozinho quando concluído ou dispensado. O progresso é derivado de
 * dados reais no backend — aqui só renderizamos e disparamos dispensar/pular.
 */
export const OnboardingChecklist: React.FC = () => {
  const { data } = useOnboarding();
  const update = useUpdateOnboarding();

  // Não atrapalha o suporte impersonando um tenant.
  if (impersonation.current()) return null;
  if (!data || data.completed || data.dismissed) return null;

  const { steps, progress } = data;
  const pct = Math.round((progress.done / progress.total) * 100);

  return (
    <div className="animate-fade-in-up bg-bg-card border border-border-subtle/60 rounded-2xl p-6 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Comece por aqui</h2>
            <p className="text-sm text-text-muted">
              Poucos passos até a sua primeira cobrança sair.
            </p>
          </div>
        </div>
        <button
          onClick={() => update.mutate({ dismiss: true })}
          disabled={update.isPending}
          className="focus-ring text-text-faint hover:text-text-main rounded-lg p-1 transition-colors"
          title="Dispensar"
          aria-label="Dispensar checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progresso */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-main">
          <div
            className="h-full rounded-full bg-brand-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-text-muted tabular-nums">
          {progress.done} de {progress.total}
        </span>
      </div>

      {/* Passos */}
      <ol className="mt-5 space-y-2.5">
        {steps.map((step, i) => (
          <li
            key={step.key}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
              step.done
                ? "border-border-subtle/40 bg-bg-main/30"
                : "border-border-subtle/60 bg-bg-main/50"
            }`}
          >
            {/* Marcador */}
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.done
                  ? "bg-brand-success/15 text-brand-success"
                  : "bg-bg-elevated text-text-muted"
              }`}
            >
              {step.done ? <Check className="h-4 w-4" /> : i + 1}
            </span>

            {/* Texto */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold ${
                  step.done ? "text-text-muted line-through" : "text-text-main"
                }`}
              >
                {step.title}
                {step.optional && (
                  <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-text-faint">
                    opcional
                  </span>
                )}
              </p>
              {!step.done && (
                <p className="text-xs text-text-faint">{step.description}</p>
              )}
              {step.done && step.skipped && (
                <p className="text-xs text-text-faint">Pulado por enquanto</p>
              )}
            </div>

            {/* Ação */}
            {!step.done && (
              <div className="flex shrink-0 items-center gap-2">
                {step.optional && (
                  <button
                    onClick={() => update.mutate({ skipWhatsapp: true })}
                    disabled={update.isPending}
                    className="focus-ring text-xs font-medium text-text-faint hover:text-text-muted rounded-lg px-2 py-1"
                  >
                    Pular
                  </button>
                )}
                <Link
                  to={step.cta.to}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold px-3 py-2 transition-colors"
                >
                  {step.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};
