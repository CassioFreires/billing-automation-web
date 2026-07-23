import React, { useState } from "react";
import { LifeBuoy, ChevronDown, ChevronUp, Ban, Clock, ShieldCheck } from "lucide-react";
import { useRecoveryCases, useRecoveryCase, useCloseRecoveryCase } from "../../hooks/useRecovery";
import type { RecoveryCaseSummary, RecoveryStatus } from "../../services/recovery.service";
import { formatBRL, formatDate } from "../../lib/format";

const STATUS: Record<RecoveryStatus, { label: string; cls: string }> = {
  open: { label: "Aberto", cls: "bg-amber-500/15 text-amber-400" },
  recovering: { label: "Recuperando", cls: "bg-brand-primary/15 text-brand-primary" },
  recovered: { label: "Recuperado", cls: "bg-emerald-500/15 text-brand-success" },
  lost: { label: "Perdido", cls: "bg-rose-500/15 text-rose-400" },
  cancelled: { label: "Encerrado", cls: "bg-bg-elevated text-text-muted" },
};

const ACTION_LABEL: Record<string, string> = {
  remind: "Lembrete",
  switch_channel: "Troca de canal",
  offer_relief: "Oferta de alívio",
};

const isActive = (s: RecoveryStatus) => s === "open" || s === "recovering";

type Filter = "ativos" | "todos";

export const RecoveryPage: React.FC = () => {
  const { data, isLoading, error } = useRecoveryCases();
  const [filter, setFilter] = useState<Filter>("ativos");

  const all = data ?? [];
  const active = all.filter((c) => isActive(c.status));
  const atRisk = active.reduce((sum, c) => sum + c.amountAtRisk, 0);
  const list = filter === "ativos" ? active : all;

  return (
    <div className="space-y-8 animate-fade-in mt-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <LifeBuoy className="h-7 w-7 text-brand-primary" /> Recuperações
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Cobranças que venceram e o Adimplo está perseguindo — insiste, oferece alívio e não
          deixa a receita cair sozinha.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Em recuperação</p>
            <p className="text-2xl font-black mt-1 text-brand-primary">{active.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Valor em risco</p>
            <p className="text-2xl font-black mt-1 text-brand-warning">{formatBRL(atRisk)}</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-warning/10 text-brand-warning">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-1 bg-bg-card border border-border-subtle/60 rounded-xl p-1 w-fit">
        {(["ativos", "todos"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition capitalize ${
              filter === f ? "bg-brand-primary/15 text-brand-primary" : "text-text-muted hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {error ? (
        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
          Não foi possível carregar as recuperações. Verifique sua conexão/sessão.
        </div>
      ) : isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-bg-card/60 border border-border-subtle/60 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-10 text-center">
          <ShieldCheck className="h-10 w-10 text-brand-success mx-auto mb-3" />
          <p className="text-sm text-text-muted">
            {filter === "ativos" ? "Nenhuma recuperação em andamento. 🎉" : "Nenhum caso registrado ainda."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <RecoveryRow key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
};

const RecoveryRow: React.FC<{ c: RecoveryCaseSummary }> = ({ c }) => {
  const [open, setOpen] = useState(false);
  const detail = useRecoveryCase(c.id, open);
  const close = useCloseRecoveryCase();
  const st = STATUS[c.status];

  return (
    <div className="bg-bg-card border border-border-subtle/60 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{c.clientName}</p>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
            {c.reliefOffered && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                Alívio ofertado
              </span>
            )}
          </div>
          <p className="text-xs text-text-faint mt-0.5">
            Passo {c.currentStep} · Venc: {formatDate(c.dueDate)}
            {isActive(c.status) && c.nextActionAt ? ` · Próxima ação: ${formatDate(c.nextActionAt)}` : ""}
            {c.resolvedAt ? ` · Encerrado: ${formatDate(c.resolvedAt)}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-bold font-mono text-brand-warning">{formatBRL(c.amountAtRisk)}</span>
          {isActive(c.status) && (
            <button
              onClick={() => close.mutate(c.id)}
              disabled={close.isPending}
              className="focus-ring flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-text-muted hover:bg-rose-500/10 hover:text-rose-300 transition disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5" /> Encerrar
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="focus-ring text-text-muted hover:text-white transition"
            aria-label={open ? "Recolher" : "Ver detalhes"}
          >
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border-subtle/60 px-5 py-4 bg-bg-main/30">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Histórico de tentativas</p>
          {detail.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-bg-elevated/60 animate-pulse" />
              ))}
            </div>
          ) : !detail.data || detail.data.attempts.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma tentativa registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {detail.data.attempts.map((a, i) => (
                <li key={i} className="flex items-center justify-between text-sm rounded-lg bg-bg-main/50 border border-border-subtle/60 px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-text-faint">#{a.step}</span>
                    <span className="font-medium">{ACTION_LABEL[a.action] ?? a.action}</span>
                    {a.channel && <span className="text-xs text-text-muted">· {a.channel}</span>}
                  </span>
                  <span className="text-xs text-text-faint">{formatDate(a.occurredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
