import React, { useMemo } from "react";
import { TrendingUp, AlertTriangle, MessageSquare, CheckCircle, Send } from "lucide-react";
import { useInvoices } from "../../hooks/useInvoices";
import { formatBRL, formatDate } from "../../lib/format";

interface Invoice {
  id: string;
  value: number;
  status: string;
  dueDate: string;
  paidAt?: string | null;
  notificationSent?: boolean;
  createdAt?: string;
  client?: { name?: string };
}

const statusBadge: Record<string, string> = {
  PAID: "text-brand-success bg-emerald-500/10 border-emerald-500/20",
  PENDING: "text-brand-warning bg-amber-500/10 border-amber-500/20",
  OVERDUE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  FAILED: "text-text-muted bg-bg-elevated border-border-subtle",
};

const statusLabel: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  FAILED: "Falhou",
};

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useInvoices({ page: 1, limit: 500 });
  const invoices: Invoice[] = data?.invoices ?? [];

  const metrics = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "PAID");
    const open = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE");
    const recuperado = paid.reduce((s, i) => s + (i.value || 0), 0);
    const emAberto = open.reduce((s, i) => s + (i.value || 0), 0);
    const notificados = invoices.filter((i) => i.notificationSent).length;
    const taxa = invoices.length ? (paid.length / invoices.length) * 100 : 0;
    return { recuperado, emAberto, pagas: paid.length, notificados, taxa };
  }, [invoices]);

  const recentes = useMemo(() => invoices.slice(0, 6), [invoices]);

  if (error) {
    return (
      <div className="mt-12 animate-fade-in text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
        Não foi possível carregar os dados. Verifique sua conexão/sessão.
      </div>
    );
  }

  const cards = [
    { label: "Recuperado", value: formatBRL(metrics.recuperado), icon: TrendingUp, color: "text-brand-success", bg: "bg-brand-success/10" },
    { label: "Em aberto", value: formatBRL(metrics.emAberto), icon: AlertTriangle, color: "text-brand-warning", bg: "bg-brand-warning/10" },
    { label: "Disparos enviados", value: String(metrics.notificados), icon: MessageSquare, color: "text-brand-primary", bg: "bg-brand-primary/10" },
    { label: "Taxa de recebimento", value: `${metrics.taxa.toFixed(1)}%`, icon: CheckCircle, color: "text-white", bg: "bg-bg-elevated" },
  ];

  return (
    <div className="space-y-8 animate-fade-in mt-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Painel de Automações</h1>
        <p className="text-text-muted text-sm mt-1">Saúde financeira e disparos do seu WhatsApp em tempo real.</p>
      </div>

      {/* Cards métricos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-bg-card p-6 rounded-2xl border border-border-subtle/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{c.label}</p>
              {isLoading ? (
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

      {/* Faturas recentes */}
      <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-brand-primary" /> Faturas recentes
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-bg-main/60 animate-pulse" />
            ))}
          </div>
        ) : recentes.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">Nenhuma fatura ainda. Crie uma cobrança para começar.</p>
        ) : (
          <div className="space-y-2.5">
            {recentes.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl bg-bg-main/50 border border-border-subtle/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.client?.name ?? "Cliente"}</p>
                  <p className="text-xs text-text-faint">Venc: {formatDate(inv.dueDate)}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold font-mono">{formatBRL(inv.value)}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusBadge[inv.status] ?? statusBadge.FAILED}`}>
                    {statusLabel[inv.status] ?? inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
