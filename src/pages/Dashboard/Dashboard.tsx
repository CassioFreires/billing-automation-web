import React, { useState } from "react";
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  Percent,
  CalendarClock,
  MousePointerClick,
  Layers,
  Sparkles,
  LifeBuoy,
  ListChecks,
  Send,
  Check,
  Loader2,
  LineChart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCockpit, useDailyActions, useTriggerCharge, useForecast } from "../../hooks/useCockpit";
import { useRecoveryCases } from "../../hooks/useRecovery";
import type { ActionItem as DailyAction } from "../../services/cockpit.service";
import { formatBRL, formatDate } from "../../lib/format";
import { OnboardingChecklist } from "../../components/Onboarding/OnboardingChecklist";

/** Estilo do selo por tipo de ação da Lista do Dia (F3). */
const KIND_BADGE: Record<string, { label: string; cls: string }> = {
  recuperar: { label: "Recuperar", cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  cobrar: { label: "Cobrar", cls: "text-brand-warning bg-amber-500/10 border-amber-500/20" },
  a_vencer: { label: "A vencer", cls: "text-brand-primary bg-brand-primary/10 border-brand-primary/20" },
};

const PERIODS = [7, 30, 90] as const;

/** Um balde do aging: cor + rótulo. */
const AGING = [
  { key: "aVencer", label: "A vencer", color: "bg-brand-primary", text: "text-brand-primary" },
  { key: "d0a30", label: "0–30 dias", color: "bg-amber-400", text: "text-amber-400" },
  { key: "d31a60", label: "31–60 dias", color: "bg-orange-500", text: "text-orange-500" },
  { key: "d60mais", label: "60+ dias", color: "bg-rose-500", text: "text-rose-500" },
] as const;

export const DashboardPage: React.FC = () => {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading, error } = useCockpit(days);
  const { data: recoveryCases } = useRecoveryCases();
  const { data: actions, isLoading: actionsLoading } = useDailyActions();
  const { data: forecast, isLoading: forecastLoading } = useForecast(30);

  const recoveryActive = (recoveryCases ?? []).filter(
    (c) => c.status === "open" || c.status === "recovering"
  );
  const recoveryAtRisk = recoveryActive.reduce((sum, c) => sum + c.amountAtRisk, 0);

  if (error) {
    return (
      <div className="mt-12 animate-fade-in text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
        Não foi possível carregar o Cockpit. Verifique sua conexão/sessão.
      </div>
    );
  }

  const k = data?.kpis;
  const aging = data?.aging;
  const agingTotal = aging ? aging.aVencer + aging.d0a30 + aging.d31a60 + aging.d60mais : 0;

  const cards = [
    { label: "A receber", value: k ? formatBRL(k.aReceber) : "—", icon: Wallet, color: "text-brand-primary", bg: "bg-brand-primary/10" },
    { label: "Em atraso", value: k ? formatBRL(k.emAtraso) : "—", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" },
    { label: `Recebido (${days}d)`, value: k ? formatBRL(k.recebidoNoPeriodo) : "—", icon: TrendingUp, color: "text-brand-success", bg: "bg-brand-success/10" },
    { label: "Inadimplência", value: k ? `${(k.taxaInadimplencia * 100).toFixed(1)}%` : "—", icon: Percent, color: "text-brand-warning", bg: "bg-brand-warning/10" },
  ];

  return (
    <div className="space-y-8 animate-fade-in mt-12">
      <OnboardingChecklist />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cockpit</h1>
          <p className="text-text-muted text-sm mt-1">O raio-x do seu caixa: quanto entra, quanto atrasa e o que fazer hoje.</p>
        </div>
        {/* Seletor de período (janela dos recebidos) */}
        <div className="flex items-center gap-1 bg-bg-card border border-border-subtle/60 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                days === p ? "bg-brand-primary/15 text-brand-primary" : "text-text-muted hover:text-white"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-bg-card p-6 rounded-2xl border border-border-subtle/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{c.label}</p>
              {isLoading && !data ? (
                <div className="h-7 w-24 mt-2 rounded bg-bg-elevated animate-pulse" />
              ) : (
                <p className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${c.bg} ${c.color}`}>
              <c.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Lista do Dia (spec 0036, F3) — o que fazer hoje, por dinheiro em risco */}
      <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-brand-primary" /> Lista do Dia
          </h3>
          {actions && actions.total > actions.mostrando && (
            <span className="text-xs text-text-faint">
              mostrando {actions.mostrando} de {actions.total}
            </span>
          )}
        </div>
        <p className="text-xs text-text-faint mb-4">
          Comece por aqui — ordenado pelo que <strong>mais dói no bolso</strong> (valor × risco × atraso).
        </p>
        <DailyActionsList loading={actionsLoading && !actions} items={actions?.itens ?? []} />
      </div>

      {/* Valor recuperado — prova de ROI (spec 0025) */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-brand-success uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Valor recuperado ({days}d)
          </p>
          {isLoading && !data ? (
            <div className="h-8 w-32 mt-2 rounded bg-bg-elevated animate-pulse" />
          ) : (
            <p className="text-3xl font-black mt-1 text-brand-success">
              {k ? formatBRL(k.recuperadoNoPeriodo) : "—"}
            </p>
          )}
          <p className="text-xs text-text-faint mt-1 max-w-md">
            Pagamentos que entraram <strong>após o vencimento</strong> — inadimplência que o
            Adimplo ajudou a virar caixa.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-success/10 text-brand-success shrink-0">
          <TrendingUp className="h-7 w-7" />
        </div>
      </div>

      {/* Previsão de caixa (spec 0039, F4) — quanto entra e quando */}
      <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <LineChart className="h-4 w-4 text-brand-primary" /> Previsão de caixa (30 dias)
          </h3>
          {forecast && (
            <div className="text-sm text-text-muted">
              provável <span className="font-bold text-brand-success">{formatBRL(forecast.total.provavel)}</span>
              <span className="text-text-faint"> de {formatBRL(forecast.total.esperado)} esperado</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-border-subtle bg-bg-main/50">
                {Math.round(forecast.total.confianca * 100)}% confiança
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-text-faint mb-4">
          O <strong>provável</strong> ajusta o esperado pela chance de cada cliente pagar (quem atrasa, atrasa na conta).
        </p>
        <ForecastChart loading={forecastLoading && !forecast} baldes={forecast?.baldes ?? []} />
      </div>

      {/* Em recuperação (spec 0033, F1) — atalho para os casos ativos */}
      {recoveryActive.length > 0 && (
        <Link
          to="/recuperacoes"
          className="block bg-bg-card border border-border-subtle/60 rounded-2xl p-6 hover:border-brand-primary/40 transition"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <LifeBuoy className="h-3.5 w-3.5 text-brand-primary" /> Em recuperação
              </p>
              <p className="text-2xl font-black mt-1">
                {recoveryActive.length}
                <span className="text-sm font-semibold text-text-muted">
                  {" "}
                  {recoveryActive.length === 1 ? "caso" : "casos"} · {formatBRL(recoveryAtRisk)} em risco
                </span>
              </p>
              <p className="text-xs text-text-faint mt-1">
                Cobranças vencidas que o Adimplo está perseguindo. Ver todas →
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
              <LifeBuoy className="h-7 w-7" />
            </div>
          </div>
        </Link>
      )}

      {/* Aging — envelhecimento da carteira */}
      <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-primary" /> Envelhecimento (aging)
        </h3>
        {isLoading && !data ? (
          <div className="h-4 rounded-full bg-bg-elevated animate-pulse" />
        ) : agingTotal <= 0 ? (
          <p className="text-sm text-text-muted py-2">Nada em aberto. 🎉</p>
        ) : (
          <>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-bg-main">
              {AGING.map((b) => {
                const val = (aging as Record<string, number>)[b.key] ?? 0;
                const pct = (val / agingTotal) * 100;
                return pct > 0 ? <div key={b.key} className={b.color} style={{ width: `${pct}%` }} title={`${b.label}: ${formatBRL(val)}`} /> : null;
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AGING.map((b) => {
                const val = (aging as Record<string, number>)[b.key] ?? 0;
                return (
                  <div key={b.key} className="rounded-xl bg-bg-main/50 border border-border-subtle/60 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${b.color}`} />
                      <span className="text-[11px] text-text-muted">{b.label}</span>
                    </div>
                    <p className={`text-sm font-bold font-mono mt-1 ${b.text}`}>{formatBRL(val)}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Ações do dia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vence essa semana */}
        <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand-warning" /> Vence essa semana
          </h3>
          <ActionList
            loading={isLoading && !data}
            empty="Nada vencendo nos próximos 7 dias."
            items={(data?.acoes.vencemEssaSemana ?? []).map((i) => ({
              id: i.invoiceId,
              title: i.clientName,
              subtitle: `Venc: ${formatDate(i.dueDate)}`,
              value: formatBRL(i.value),
            }))}
          />
        </div>

        {/* Hesitando — o sinal do Elo */}
        <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-brand-primary" /> Hesitando
          </h3>
          <p className="text-xs text-text-faint mb-4">Abriram o link de cobrança e ainda não pagaram — candidatos a uma oferta de alívio.</p>
          <ActionList
            loading={isLoading && !data}
            empty="Ninguém hesitando por enquanto."
            items={(data?.acoes.hesitando ?? []).map((i) => ({
              id: i.invoiceId,
              title: i.clientName,
              subtitle: `Abriu ${i.opens}× · não pagou`,
              value: formatBRL(i.value),
            }))}
          />
        </div>
      </div>
    </div>
  );
};

/** Lista do Dia (F3): itens priorizados com "Cobrar agora" por linha. */
const DailyActionsList: React.FC<{ loading: boolean; items: DailyAction[] }> = ({ loading, items }) => {
  const trigger = useTriggerCharge();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const cobrar = async (invoiceId: string) => {
    try {
      await trigger.mutateAsync(invoiceId);
      setDoneIds((s) => new Set(s).add(invoiceId));
    } catch {
      /* silencioso: o dono pode tentar de novo */
    }
  };

  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-bg-main/60 animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-text-muted py-6 text-center">Nada pendente hoje. 🎉</p>;
  }
  return (
    <div className="space-y-2.5">
      {items.map((it) => {
        const badge = KIND_BADGE[it.kind] ?? KIND_BADGE.cobrar;
        const done = doneIds.has(it.invoiceId);
        const pending = trigger.isPending && trigger.variables === it.invoiceId;
        return (
          <div key={it.invoiceId} className="flex items-center justify-between gap-3 rounded-xl bg-bg-main/50 border border-border-subtle/60 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badge.cls}`}>{badge.label}</span>
                <p className="text-sm font-medium truncate">{it.clientName}</p>
              </div>
              <p className="text-xs text-text-faint mt-0.5">{it.motivo}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold font-mono">{formatBRL(it.value)}</span>
              <button
                onClick={() => cobrar(it.invoiceId)}
                disabled={pending || done}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-60"
                title="Enfileirar a cobrança dessa fatura agora"
              >
                {done ? (
                  <><Check className="h-3.5 w-3.5 text-brand-success" /> Enviado</>
                ) : pending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> …</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Cobrar agora</>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Previsão de caixa (F4): barra por semana — esperado (trilho) × provável (preenchido). */
const ForecastChart: React.FC<{
  loading: boolean;
  baldes: { label: string; de: string; esperado: number; provavel: number }[];
}> = ({ loading, baldes }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-bg-main/60 animate-pulse" />
        ))}
      </div>
    );
  }
  const max = Math.max(1, ...baldes.map((b) => b.esperado));
  if (baldes.every((b) => b.esperado === 0)) {
    return <p className="text-sm text-text-muted py-6 text-center">Nada previsto para os próximos 30 dias.</p>;
  }
  return (
    <div className="space-y-3">
      {baldes.map((b) => (
        <div key={b.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">
              {b.label} <span className="text-text-faint">· {formatDate(b.de)}</span>
            </span>
            <span className="font-mono">
              <span className="text-brand-success font-semibold">{formatBRL(b.provavel)}</span>
              <span className="text-text-faint"> / {formatBRL(b.esperado)}</span>
            </span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-bg-main overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-brand-primary/25" style={{ width: `${(b.esperado / max) * 100}%` }} />
            <div className="absolute inset-y-0 left-0 bg-brand-success" style={{ width: `${(b.provavel / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-1 text-[11px] text-text-faint">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-success" /> provável</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-primary/25" /> esperado</span>
      </div>
    </div>
  );
};

interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  value: string;
}

const ActionList: React.FC<{ loading: boolean; empty: string; items: ActionItem[] }> = ({ loading, empty, items }) => {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-bg-main/60 animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-text-muted py-6 text-center">{empty}</p>;
  }
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between rounded-xl bg-bg-main/50 border border-border-subtle/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{it.title}</p>
            <p className="text-xs text-text-faint">{it.subtitle}</p>
          </div>
          <span className="text-sm font-semibold font-mono shrink-0">{it.value}</span>
        </div>
      ))}
    </div>
  );
};
