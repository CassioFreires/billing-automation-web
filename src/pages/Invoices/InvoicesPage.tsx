import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Send, Eye, ChevronLeft, ChevronRight, Loader2, AlertCircle, Copy, Check, CheckCircle2, Trash2, Wallet, UploadCloud } from "lucide-react";
import { isAxiosError } from "axios";
import { Modal } from "../../components/ui/Modal";
import { ImportInvoicesWizard } from "./ImportInvoicesWizard";
import { useInvoices, useCreateInvoice, useTriggerNotification } from "../../hooks/useInvoices";
import { usePayments, useRegisterPayment } from "../../hooks/usePayments";
import { useClients } from "../../hooks/useClients";
import type { Invoice, InvoiceInput, InvoiceItem } from "../../services/invoices.service";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "../../services/payments.service";
import type { PaymentMethod, RegisterPaymentInput } from "../../services/payments.service";
import { formatBRL, formatDate } from "../../lib/format";

const newItem = (): InvoiceItem => ({ description: "", quantity: 1, unitPrice: 0 });
const itemsTotal = (items: InvoiceItem[]) => items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);

const FILTERS = [
  { label: "Todas", value: "" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Vencidas", value: "OVERDUE" },
  { label: "Pagas", value: "PAID" },
];

const statusBadge: Record<string, string> = {
  PAID: "text-brand-success bg-emerald-500/10 border-emerald-500/20",
  PENDING: "text-brand-warning bg-amber-500/10 border-amber-500/20",
  OVERDUE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  FAILED: "text-text-muted bg-bg-elevated border-border-subtle",
};
const statusLabel: Record<string, string> = { PAID: "Pago", PENDING: "Pendente", OVERDUE: "Vencido", FAILED: "Falhou" };

const EMPTY_FORM: InvoiceInput = { clientId: "", dueDate: "", items: [newItem()] };

// Data de hoje no formato do <input type="date"> (YYYY-MM-DD, fuso local).
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface SettleForm {
  method: PaymentMethod;
  amount: string; // vazio = usa o valor total da fatura (default do backend)
  paidAt: string;
  note: string;
}
const emptySettle = (): SettleForm => ({ method: "pix", amount: "", paidAt: todayISO(), note: "" });

// Uma fatura PAGA não é cobrável nem exibe dados de pagamento (PIX/checkout).
const isPaid = (status: string) => status === "PAID";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

export const InvoicesPage: React.FC = () => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useInvoices({ page, limit, status: status || undefined });
  const { data: clients = [] } = useClients();
  const createInvoice = useCreateInvoice();
  const triggerNotification = useTriggerNotification();

  const invoices: Invoice[] = data?.invoices ?? [];
  const meta = data?.meta ?? { totalItems: 0, totalPages: 1, currentPage: 1, limit };

  const [searchParams, setSearchParams] = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<InvoiceInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Baixa manual (recebimentos — spec 0015).
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleForm, setSettleForm] = useState<SettleForm>(emptySettle());
  const [settleError, setSettleError] = useState<string | null>(null);
  const registerPayment = useRegisterPayment();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(detail?.id ?? null);

  const openCreate = () => {
    setForm({ clientId: "", dueDate: "", items: [newItem()] });
    setFormError(null);
    setFormOpen(true);
  };

  // Deep-link do onboarding (spec 0021): /invoices?new=1 abre o modal de criação
  // e limpa o parâmetro para não reabrir ao recarregar.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openCreate();
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, newItem()] }));
  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : f.items }));
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.clientId) return setFormError("Selecione um cliente.");
    if (!form.dueDate) return setFormError("Informe a data de vencimento.");
    const valid = form.items.filter((i) => i.description.trim() && i.unitPrice > 0 && i.quantity > 0);
    if (valid.length === 0) return setFormError("Adicione ao menos um item com descrição e valor.");
    try {
      await createInvoice.mutateAsync({ clientId: form.clientId, dueDate: form.dueDate, items: valid });
      setFormOpen(false);
      setPage(1);
    } catch (err) {
      setFormError(apiError(err, "Erro ao criar a cobrança."));
    }
  };

  const trigger = async (id: string) => {
    setTriggeringId(id);
    try {
      await triggerNotification.mutateAsync(id);
    } finally {
      setTriggeringId(null);
    }
  };

  const copyPix = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openSettle = () => {
    setSettleForm(emptySettle());
    setSettleError(null);
    setSettleOpen(true);
  };

  const submitSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setSettleError(null);
    const input: RegisterPaymentInput = { method: settleForm.method };
    if (settleForm.amount.trim()) {
      const amount = parseFloat(settleForm.amount.replace(",", "."));
      if (!(amount > 0)) return setSettleError("Informe um valor maior que zero (ou deixe em branco para o total).");
      input.amount = amount;
    }
    if (settleForm.paidAt) input.paidAt = new Date(`${settleForm.paidAt}T12:00:00`).toISOString();
    if (settleForm.note.trim()) input.note = settleForm.note.trim();
    try {
      const { invoice } = await registerPayment.mutateAsync({ invoiceId: detail.id, input });
      setSettleOpen(false);
      setDetail(invoice); // reflete a fatura já quitada no modal de detalhe
    } catch (err) {
      setSettleError(apiError(err, "Erro ao registrar o pagamento."));
    }
  };

  const changeFilter = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const inputClass = "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  return (
    <div className="space-y-6 animate-fade-in mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Faturas</h1>
          <p className="text-text-muted text-sm mt-1">Gere cobranças e acompanhe os pagamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="focus-ring border border-border-subtle hover:bg-bg-elevated text-text-main font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <UploadCloud className="h-4 w-4" /> Importar CSV
          </button>
          <button
            onClick={openCreate}
            className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-500/10"
          >
            <Plus className="h-4 w-4" /> Nova cobrança
          </button>
        </div>
      </div>

      {/* Filtro por status */}
      <div className="inline-flex bg-bg-card/50 border border-border-subtle/80 rounded-xl p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => changeFilter(f.value)}
            className={`focus-ring px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              status === f.value ? "bg-brand-primary text-white" : "text-text-muted hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {error ? (
        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">Não foi possível carregar as faturas.</div>
      ) : (
        <div className="bg-bg-card/40 border border-border-subtle/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-card/80 border-b border-border-subtle text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Notificado</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="p-3"><div className="h-8 rounded-lg bg-bg-main/60 animate-pulse" /></td></tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-10 text-text-muted">Nenhuma fatura {status ? "nesse filtro" : "cadastrada"}.</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-bg-elevated/20 transition-colors">
                      <td className="p-4 font-medium">{inv.client?.name ?? "—"}</td>
                      <td className="p-4 font-mono font-semibold">{formatBRL(inv.value)}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusBadge[inv.status] ?? statusBadge.FAILED}`}>
                          {statusLabel[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted text-xs">{formatDate(inv.dueDate)}</td>
                      <td className="p-4">
                        {inv.notificationSent ? (
                          <span className="text-brand-success text-xs">Sim</span>
                        ) : (
                          <span className="text-text-faint text-xs">Não</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetail(inv)}
                            className="focus-ring p-2 rounded-lg text-text-muted hover:text-white hover:bg-bg-elevated transition-all"
                            aria-label="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isPaid(inv.status) ? (
                            <span className="p-2 text-brand-success" title="Fatura paga" aria-label="Fatura paga">
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => { setDetail(inv); openSettle(); }}
                                className="focus-ring p-2 rounded-lg text-text-muted hover:text-white hover:bg-brand-success transition-all"
                                aria-label="Dar baixa (registrar pagamento)"
                                title="Dar baixa"
                              >
                                <Wallet className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => trigger(inv.id)}
                                disabled={triggeringId === inv.id}
                                className="focus-ring p-2 rounded-lg text-text-muted hover:text-white hover:bg-brand-primary transition-all disabled:opacity-50"
                                aria-label="Disparar cobrança"
                              >
                                {triggeringId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {meta.totalPages > 1 && (
            <div className="bg-bg-card/60 border-t border-border-subtle px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-text-muted">Página {meta.currentPage} de {meta.totalPages} · {meta.totalItems} faturas</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="focus-ring p-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-muted hover:text-white disabled:opacity-40 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))} disabled={page >= meta.totalPages} className="focus-ring p-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-muted hover:text-white disabled:opacity-40 transition-colors"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal nova cobrança */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nova cobrança">
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{formError}</span>
            </div>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Cliente</span>
            {clients.length === 0 ? (
              <p className="text-sm text-text-faint">Cadastre um cliente antes de criar uma cobrança.</p>
            ) : (
              <select className={inputClass} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Selecione…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
                ))}
              </select>
            )}
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Vencimento</span>
            <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Itens</span>
              <button type="button" onClick={addItem} className="focus-ring text-xs text-brand-primary hover:text-brand-hover flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Adicionar item
              </button>
            </div>
            {form.items.map((it, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input className={`${inputClass} flex-1`} placeholder="Descrição" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                <input type="number" min="1" className={`${inputClass} w-14 text-center`} title="Qtd" value={it.quantity || ""} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 0 })} />
                <input type="number" step="0.01" min="0" className={`${inputClass} w-24`} placeholder="R$" value={it.unitPrice || ""} onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })} />
                <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="focus-ring p-2 text-text-faint hover:text-rose-300 disabled:opacity-30" aria-label="Remover item">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex justify-between pt-1 text-sm border-t border-border-subtle/60 mt-1">
              <span className="text-text-muted pt-2">Total</span>
              <span className="font-mono font-semibold pt-2">{formatBRL(itemsTotal(form.items))}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all">Cancelar</button>
            <button type="submit" disabled={createInvoice.isPending || clients.length === 0} className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60">
              {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Gerar cobrança
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal detalhe / PIX */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Cobrança">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-sm">{detail.client?.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold">{formatBRL(detail.value)}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusBadge[detail.status] ?? statusBadge.FAILED}`}>
                  {statusLabel[detail.status] ?? detail.status}
                </span>
              </div>
            </div>

            {detail.items && detail.items.length > 0 && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Itens</p>
                <div className="rounded-xl border border-border-subtle/60 divide-y divide-border-subtle/50">
                  {detail.items.map((it, i) => (
                    <div key={i} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-text-muted">{it.quantity}× {it.description}</span>
                      <span className="font-mono">{formatBRL(it.quantity * it.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPaid(detail.status) ? (
              /* Fatura paga: sem PIX/checkout — mostra a confirmação. */
              <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-brand-success rounded-xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Pagamento confirmado</p>
                  {detail.paidAt && <p className="text-emerald-300/80 text-xs">Pago em {formatDate(detail.paidAt)}</p>}
                </div>
              </div>
            ) : (
              /* Fatura em aberto: opções de pagamento. */
              <>
                {detail.checkoutUrl && (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Link de checkout</p>
                    <a href={detail.checkoutUrl} target="_blank" rel="noreferrer" className="text-brand-primary hover:text-brand-hover text-sm break-all">{detail.checkoutUrl}</a>
                  </div>
                )}
                {detail.pixCopyPaste ? (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">PIX Copia e Cola</p>
                    <div className="flex items-start gap-2 bg-bg-main/60 border border-border-subtle rounded-xl p-3">
                      <code className="text-xs break-all text-text-muted flex-1">{detail.pixCopyPaste}</code>
                      <button onClick={() => copyPix(detail.pixCopyPaste!)} className="focus-ring shrink-0 text-text-muted hover:text-white" aria-label="Copiar PIX">
                        {copied ? <Check className="h-4 w-4 text-brand-success" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-faint">Sem dados de PIX para esta cobrança.</p>
                )}
                <button
                  onClick={openSettle}
                  className="focus-ring w-full bg-brand-success/90 hover:bg-brand-success text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Wallet className="h-4 w-4" /> Dar baixa (registrar pagamento)
                </button>
              </>
            )}

            {/* Recebimentos da fatura (spec 0015). */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Recebimentos</p>
              {paymentsLoading ? (
                <div className="h-10 rounded-xl bg-bg-main/60 animate-pulse" />
              ) : payments.length === 0 ? (
                <p className="text-sm text-text-faint">Nenhum recebimento registrado.</p>
              ) : (
                <div className="rounded-xl border border-border-subtle/60 divide-y divide-border-subtle/50">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-text-muted">
                          {p.method ? PAYMENT_METHOD_LABEL[p.method as PaymentMethod] ?? p.method : "—"}
                          <span className="text-text-faint"> · {p.source === "gateway" ? "gateway" : "manual"}</span>
                        </span>
                        <span className="text-text-faint text-xs">{formatDate(p.paidAt)}{p.note ? ` · ${p.note}` : ""}</span>
                      </div>
                      <span className="font-mono font-semibold text-brand-success">{formatBRL(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal baixa manual (recebimentos) */}
      <Modal open={settleOpen} onClose={() => setSettleOpen(false)} title="Dar baixa">
        {detail && (
          <form onSubmit={submitSettle} className="space-y-4">
            {settleError && (
              <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{settleError}</span>
              </div>
            )}
            <div className="flex items-center justify-between bg-bg-main/50 border border-border-subtle/60 rounded-xl px-3.5 py-2.5">
              <span className="text-text-muted text-sm">{detail.client?.name ?? "Fatura"}</span>
              <span className="font-mono font-semibold">{formatBRL(detail.value)}</span>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Meio de pagamento</span>
              <select
                className={inputClass}
                value={settleForm.method}
                onChange={(e) => setSettleForm({ ...settleForm, method: e.target.value as PaymentMethod })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Valor</span>
                <input
                  type="number" step="0.01" min="0"
                  className={inputClass}
                  placeholder={formatBRL(detail.value)}
                  value={settleForm.amount}
                  onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Data</span>
                <input
                  type="date"
                  className={inputClass}
                  value={settleForm.paidAt}
                  onChange={(e) => setSettleForm({ ...settleForm, paidAt: e.target.value })}
                />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Observação (opcional)</span>
              <input
                className={inputClass}
                placeholder="Ex.: pago na recepção"
                value={settleForm.note}
                onChange={(e) => setSettleForm({ ...settleForm, note: e.target.value })}
              />
            </label>
            <p className="text-xs text-text-faint">Deixe o valor em branco para quitar pelo total da fatura.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setSettleOpen(false)} className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all">Cancelar</button>
              <button type="submit" disabled={registerPayment.isPending} className="focus-ring flex-1 bg-brand-success/90 hover:bg-brand-success text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60">
                {registerPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar baixa
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Importação de faturas por CSV (spec 0024) */}
      <ImportInvoicesWizard open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
};
