import React, { useState } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Repeat,
  Loader2,
  AlertCircle,
  Play,
  Pause,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";
import { isAxiosError } from "axios";
import { Modal } from "../../components/ui/Modal";
import { formatBRL, formatDate } from "../../lib/format";
import { useClients } from "../../hooks/useClients";
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  useRunSubscriptions,
} from "../../hooks/useSubscriptions";
import type { Subscription, RunResult } from "../../services/subscriptions.service";
import { useOpenCancellation, useResolveCancellation } from "../../hooks/useRetention";
import type { CancellationReason, OpenCancellationResult, SaveOffer } from "../../services/retention.service";

/** Motivos do cancelamento (F11) — rótulos amigáveis. */
const REASON_OPTIONS: { value: CancellationReason; label: string }[] = [
  { value: "preco", label: "Está caro / aperto no orçamento" },
  { value: "nao_uso", label: "Não estou usando" },
  { value: "mudanca", label: "Mudança (endereço, momento, etc.)" },
  { value: "insatisfacao", label: "Insatisfação com o serviço" },
  { value: "outro", label: "Outro motivo" },
];

/** Rótulo da oferta de retenção (F11). */
const OFFER_LABEL: Record<SaveOffer, string> = {
  pause: "Pausar assinatura",
  discount: "Oferecer desconto temporário",
  downgrade: "Oferecer plano mais enxuto",
  winback_later: "Deixar voltar depois",
};

interface FormState {
  clientId: string;
  description: string;
  amount: string;
  dayOfMonth: string;
}

const EMPTY_FORM: FormState = { clientId: "", description: "", amount: "", dayOfMonth: "10" };

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

const STATUS_META: Record<Subscription["status"], { label: string; cls: string }> = {
  ACTIVE: { label: "Ativa", cls: "text-brand-success bg-emerald-500/10 border-emerald-500/20" },
  PAUSED: { label: "Pausada", cls: "text-brand-warning bg-amber-500/10 border-amber-500/20" },
  CANCELED: { label: "Cancelada", cls: "text-text-muted bg-bg-elevated/40 border-border-subtle" },
};

export const SubscriptionsPage: React.FC = () => {
  const { data: subs = [], isLoading, error } = useSubscriptions();
  const { data: clients = [] } = useClients();
  const createSub = useCreateSubscription();
  const updateSub = useUpdateSubscription();
  const deleteSub = useDeleteSubscription();
  const runSubs = useRunSubscriptions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Subscription | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  // Fluxo de retenção (F11): assinatura em cancelamento, motivo e oferta recomendada.
  const [toCancel, setToCancel] = useState<Subscription | null>(null);
  const [reason, setReason] = useState<CancellationReason>("preco");
  const [offer, setOffer] = useState<OpenCancellationResult | null>(null);
  const [discountPct, setDiscountPct] = useState(30);
  const [discountMo, setDiscountMo] = useState(2);
  const openCancellation = useOpenCancellation();
  const resolveCancellation = useResolveCancellation();

  const startCancel = (s: Subscription) => {
    setToCancel(s);
    setReason("preco");
    setOffer(null);
  };
  const closeCancel = () => {
    setToCancel(null);
    setOffer(null);
    openCancellation.reset();
    resolveCancellation.reset();
  };
  const seeOffer = async () => {
    if (!toCancel) return;
    try {
      const result = await openCancellation.mutateAsync({ subscriptionId: toCancel.id, reason });
      setDiscountPct(result.suggestedPercent);
      setDiscountMo(result.suggestedMonths);
      setOffer(result);
    } catch {
      /* erro tratado pelo estado da mutation */
    }
  };
  const resolveCancel = async (outcome: "saved" | "cancelled") => {
    if (!offer) return;
    try {
      await resolveCancellation.mutateAsync({
        id: offer.id,
        outcome,
        offer: outcome === "saved" ? offer.recommended : undefined,
        ...(outcome === "saved" && offer.recommended === "discount"
          ? { discountPercent: discountPct, discountMonths: discountMo }
          : {}),
      });
      closeCancel();
    } catch {
      /* mantém o modal */
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (s: Subscription) => {
    setEditing(s);
    setForm({
      clientId: s.clientId,
      description: s.description,
      amount: String(s.amount),
      dayOfMonth: String(s.dayOfMonth),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = Number(form.amount);
    const dayOfMonth = Number(form.dayOfMonth);
    if (!editing && !form.clientId) return setFormError("Selecione um cliente.");
    if (form.description.trim().length < 1) return setFormError("Informe a descrição.");
    if (!(amount > 0)) return setFormError("Valor deve ser maior que zero.");
    if (!(dayOfMonth >= 1 && dayOfMonth <= 28)) return setFormError("Dia de vencimento deve ser entre 1 e 28.");

    try {
      if (editing) {
        await updateSub.mutateAsync({
          id: editing.id,
          data: { description: form.description, amount, dayOfMonth },
        });
      } else {
        await createSub.mutateAsync({
          clientId: form.clientId,
          description: form.description,
          amount,
          dayOfMonth,
        });
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(apiError(err, "Erro ao salvar a assinatura."));
    }
  };

  const toggleStatus = async (s: Subscription) => {
    const next = s.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await updateSub.mutateAsync({ id: s.id, data: { status: next } });
    } catch {
      // silencioso; a lista continua consistente pelo refetch
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteSub.mutateAsync(toDelete.id);
      setToDelete(null);
    } catch {
      /* mantém o modal */
    }
  };

  const doRun = async () => {
    try {
      const res = await runSubs.mutateAsync();
      setRunResult(res);
    } catch {
      setRunResult(null);
    }
  };

  const saving = createSub.isPending || updateSub.isPending;
  const inputClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  return (
    <div className="space-y-6 animate-fade-in mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Assinaturas</h1>
          <p className="text-text-muted text-sm mt-1">
            Mensalidades recorrentes — geram faturas automaticamente todo mês.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={doRun}
            disabled={runSubs.isPending}
            className="focus-ring border border-border-subtle hover:bg-bg-elevated text-text-muted hover:text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            title="Gera agora as faturas das assinaturas vencidas"
          >
            {runSubs.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Gerar faturas
          </button>
          <button
            onClick={openCreate}
            className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-500/10"
          >
            <Plus className="h-4 w-4" /> Nova assinatura
          </button>
        </div>
      </div>

      {/* Resultado da geração */}
      {runResult && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-brand-success rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>
            Geração concluída: <strong>{runResult.geradas}</strong> fatura(s) criada(s),{" "}
            <strong>{runResult.ignoradas}</strong> já existia(m) ({runResult.processadas} assinatura(s) avaliada(s)).
          </span>
        </div>
      )}

      {/* Conteúdo */}
      {error ? (
        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
          Não foi possível carregar as assinaturas.
        </div>
      ) : (
        <div className="bg-bg-card/40 border border-border-subtle/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-card/80 border-b border-border-subtle text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Assinatura</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Próxima geração</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-sm">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-3">
                        <div className="h-8 rounded-lg bg-bg-main/60 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : subs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-10 text-text-muted">
                      Nenhuma assinatura ainda. Crie uma mensalidade para automatizar a cobrança.
                    </td>
                  </tr>
                ) : (
                  subs.map((s) => {
                    const meta = STATUS_META[s.status];
                    return (
                      <tr key={s.id} className="hover:bg-bg-elevated/20 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary shrink-0">
                              <Repeat className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{s.description}</span>
                          </div>
                        </td>
                        <td className="p-4 text-text-muted">{s.client?.name ?? "—"}</td>
                        <td className="p-4 font-semibold">
                          {formatBRL(s.amount)}
                          {s.discountPercent && s.discountUntil && new Date(s.discountUntil) >= new Date() && (
                            <span
                              className="ml-2 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-brand-success font-medium"
                              title={`Desconto de retenção ativo até ${formatDate(s.discountUntil)}`}
                            >
                              -{s.discountPercent}% até {formatDate(s.discountUntil)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-text-muted">dia {s.dayOfMonth}</td>
                        <td className="p-4 text-text-muted font-mono text-xs">{formatDate(s.nextRunDate)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {s.status !== "CANCELED" && (
                              <button
                                onClick={() => toggleStatus(s)}
                                className="focus-ring p-2 rounded-lg text-text-muted hover:text-white hover:bg-bg-elevated transition-all"
                                aria-label={s.status === "ACTIVE" ? "Pausar" : "Retomar"}
                                title={s.status === "ACTIVE" ? "Pausar" : "Retomar"}
                              >
                                {s.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </button>
                            )}
                            {s.status !== "CANCELED" && (
                              <button
                                onClick={() => startCancel(s)}
                                className="focus-ring p-2 rounded-lg text-text-muted hover:text-brand-primary hover:bg-sky-500/10 transition-all"
                                aria-label="Cancelar com retenção"
                                title="Cancelar (o sistema tenta reter antes)"
                              >
                                <HeartHandshake className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(s)}
                              className="focus-ring p-2 rounded-lg text-text-muted hover:text-white hover:bg-bg-elevated transition-all"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setToDelete(s)}
                              className="focus-ring p-2 rounded-lg text-text-muted hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar assinatura" : "Nova assinatura"}
      >
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {!editing && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Cliente</span>
              <select
                className={inputClass}
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              >
                <option value="">Selecione…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Descrição</span>
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Plano Mensal, Mensalidade…"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Valor mensal (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="99.90"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Dia do vencimento</span>
              <input
                type="number"
                min="1"
                max="28"
                className={inputClass}
                value={form.dayOfMonth}
                onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                placeholder="10"
              />
            </label>
          </div>
          <p className="text-xs text-text-faint">O vencimento vai de 1 a 28 para valer em todos os meses.</p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Criar assinatura"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal excluir */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Excluir assinatura">
        <p className="text-sm text-text-muted">
          Excluir <span className="text-white font-medium">{toDelete?.description}</span>? As faturas já geradas
          continuam no histórico; apenas a recorrência para.
        </p>
        <div className="flex gap-3 pt-5">
          <button
            onClick={() => setToDelete(null)}
            className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleteSub.isPending}
            className="focus-ring flex-1 bg-brand-danger hover:bg-rose-500 text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {deleteSub.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Excluir
          </button>
        </div>
      </Modal>

      {/* Modal de retenção (F11): motivo → oferta → salvar/cancelar */}
      <Modal open={!!toCancel} onClose={closeCancel} title="Cancelar assinatura">
        {!offer ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Antes de cancelar <span className="text-white font-medium">{toCancel?.description}</span>, conte o
              motivo — o sistema sugere uma alternativa para não perder o cliente.
            </p>
            <div className="space-y-2">
              {REASON_OPTIONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-all ${
                    reason === r.value
                      ? "border-brand-primary/50 bg-brand-primary/10"
                      : "border-border-subtle hover:bg-bg-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    className="accent-brand-primary"
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            {openCancellation.isError && (
              <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Não foi possível abrir o fluxo. Tente de novo.</span>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeCancel}
                className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all"
              >
                Voltar
              </button>
              <button
                onClick={seeOffer}
                disabled={openCancellation.isPending}
                className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {openCancellation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Ver opção de retenção
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-4 py-3.5">
              <HeartHandshake className="h-5 w-5 text-brand-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Sugestão: {OFFER_LABEL[offer.recommended]}
                </p>
                <p className="text-sm text-text-muted mt-1">{offer.message}</p>
              </div>
            </div>
            <p className="text-xs text-text-faint">
              Cliente: <span className="text-text-muted">{offer.subscription.clientName}</span>
              {offer.recommended === "pause"
                ? " · aplicar deixa a assinatura Pausada (a vaga fica guardada)."
                : offer.recommended === "discount"
                ? " · aplicar dá o desconto nas próximas faturas automaticamente e volta ao normal depois."
                : " · registramos a retenção; a assinatura segue ativa para você aplicar a oferta."}
            </p>

            {offer.recommended === "discount" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Desconto (%)</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className={inputClass}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value))}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Por (meses)</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className={inputClass}
                    value={discountMo}
                    onChange={(e) => setDiscountMo(Number(e.target.value))}
                  />
                </label>
              </div>
            )}

            {resolveCancellation.isError && (
              <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Não foi possível concluir. Tente de novo.</span>
              </div>
            )}
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => resolveCancel("saved")}
                disabled={resolveCancellation.isPending}
                className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {resolveCancellation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {offer.recommended === "discount"
                  ? `Aplicar ${discountPct}% por ${discountMo} ${discountMo === 1 ? "mês" : "meses"}`
                  : `Aplicar: ${OFFER_LABEL[offer.recommended]}`}
              </button>
              <button
                onClick={() => resolveCancel("cancelled")}
                disabled={resolveCancellation.isPending}
                className="focus-ring w-full border border-border-subtle hover:bg-rose-500/10 hover:text-rose-300 text-text-muted rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-60"
              >
                Cancelar assinatura mesmo assim
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
