import React, { useState } from "react";
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  Percent,
  CalendarClock,
  MousePointerClick,
  Layers,
} from "lucide-react";
import { useCockpit } from "../../hooks/useCockpit";
import { formatBRL, formatDate } from "../../lib/format";
import { OnboardingChecklist } from "../../components/Onboarding/OnboardingChecklist";

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
