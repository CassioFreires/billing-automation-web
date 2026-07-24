import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Clock, FileSignature } from "lucide-react";
import portalService from "../../services/portal.service";
import type { PortalInvoice, PortalContract } from "../../services/portal.service";
import { Logo } from "../../components/Logo";
import { formatBRL, formatDate } from "../../lib/format";

const statusMeta: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendente", cls: "text-brand-warning bg-amber-500/10 border-amber-500/20" },
  OVERDUE: { label: "Vencida", cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  PAID: { label: "Paga", cls: "text-brand-success bg-emerald-500/10 border-emerald-500/20" },
  RENEGOTIATED: { label: "Renegociada", cls: "text-brand-primary bg-sky-500/10 border-sky-500/20" },
  FAILED: { label: "Falhou", cls: "text-text-muted bg-bg-elevated border-border-subtle" },
};

/** Página PÚBLICA do Portal do pagador (spec 0027) — todas as cobranças dele. */
export const PortalPage: React.FC = () => {
  const { token = "" } = useParams<{ token: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", token],
    queryFn: () => portalService.getByToken(token),
    retry: false,
  });

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Logo size={40} />
        </div>
        {children}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-text-faint">
          <ShieldCheck className="h-3.5 w-3.5" /> Portal seguro via Adimplo
        </p>
        <p className="mt-2 text-center text-[11px] text-text-faint">
          Seus dados são tratados conforme a{" "}
          <a href="/privacidade" target="_blank" rel="noreferrer" className="underline hover:text-text-muted">
            Política de Privacidade
          </a>.
        </p>
      </div>
    </div>
  );

  const card = "bg-bg-card border border-border-subtle/80 rounded-2xl p-6";

  if (isLoading) {
    return shell(
      <div className={`${card} flex items-center justify-center h-48`}>
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error || !data) {
    return shell(
      <div className={card}>
        <div className="flex items-start gap-2 text-rose-300">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Portal não encontrado</p>
            <p className="text-sm text-text-muted mt-1">
              O link pode estar incorreto ou expirado. Fale com quem enviou a cobrança.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return shell(
    <div className="space-y-5">
      <div className={card}>
        <p className="text-sm text-text-muted">Olá,</p>
        <h1 className="text-2xl font-bold tracking-tight">{data.clientName}</h1>
        {data.totals.openCount > 0 ? (
          <p className="text-sm text-text-muted mt-2">
            Você tem <strong className="text-text-main">{data.totals.openCount}</strong> cobrança(s) em
            aberto, somando{" "}
            <strong className="text-brand-primary">{formatBRL(data.totals.openValue)}</strong>.
          </p>
        ) : (
          <p className="text-sm text-brand-success mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Você está em dia. Nada em aberto! 🎉
          </p>
        )}
      </div>

      {data.contract && <ContractCard token={token} contract={data.contract} />}

      {data.open.length > 0 && (
        <div className={card}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-warning" /> Em aberto
          </h2>
          <div className="space-y-3">
            {data.open.map((inv) => (
              <PortalRow key={inv.id} inv={inv} highlight />
            ))}
          </div>
        </div>
      )}

      {data.history.length > 0 && (
        <div className={card}>
          <h2 className="font-bold text-lg mb-4">Histórico</h2>
          <div className="space-y-3">
            {data.history.map((inv) => (
              <PortalRow key={inv.id} inv={inv} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** Contrato no Celular (spec 0040): mostra o contrato e permite assinar (nome + concordo). */
const ContractCard: React.FC<{ token: string; contract: PortalContract }> = ({ token, contract }) => {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const accept = useMutation({
    mutationFn: () => portalService.acceptContract(token, name.trim()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", token] }),
  });

  const card = "bg-bg-card border border-border-subtle/80 rounded-2xl p-6";

  if (contract.accepted) {
    return (
      <div className={`${card} border-emerald-500/20`}>
        <div className="flex items-center gap-2 text-brand-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Contrato aceito</p>
            <p className="text-xs text-text-muted">
              {contract.title} (v{contract.version})
              {contract.acceptedAt ? ` · em ${formatDate(contract.acceptedAt)}` : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (name.trim().length < 3) return setErr("Digite seu nome completo.");
    if (!agree) return setErr("Você precisa marcar que leu e concorda.");
    accept.mutate();
  };

  return (
    <div className={card}>
      <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
        <FileSignature className="h-4 w-4 text-brand-primary" /> {contract.title}
      </h2>
      <p className="text-xs text-text-faint mb-3">Leia e assine para continuar (v{contract.version}).</p>

      {contract.mode === "file" ? (
        <a
          href={`/api/public/portal/${token}/contract/file`}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-bg-main/50 border border-border-subtle/60 px-4 py-4 text-sm font-medium text-brand-primary hover:bg-bg-elevated transition-all"
        >
          <FileSignature className="h-4 w-4" /> Ver contrato (PDF){contract.fileName ? ` · ${contract.fileName}` : ""}
        </a>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-xl bg-bg-main/50 border border-border-subtle/60 p-4 text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
          {contract.body}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Seu nome completo (assinatura)</span>
          <input
            className="focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
          />
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer text-sm">
          <input type="checkbox" className="mt-0.5 accent-brand-primary h-4 w-4" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="text-text-muted">Li e concordo com o contrato acima.</span>
        </label>

        {err && (
          <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        {accept.isError && (
          <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Não foi possível registrar o aceite. Tente de novo.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={accept.isPending}
          className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {accept.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Assinar contrato
        </button>
      </form>
    </div>
  );
};

const PortalRow: React.FC<{ inv: PortalInvoice; highlight?: boolean }> = ({ inv, highlight }) => {
  const meta = statusMeta[inv.status] ?? statusMeta.FAILED;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-main/50 border border-border-subtle/60 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-mono">{formatBRL(inv.value)}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.cls}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-xs text-text-faint mt-0.5">
          {inv.paidAt ? `Pago em ${formatDate(inv.paidAt)}` : `Vencimento ${formatDate(inv.dueDate)}`}
        </p>
      </div>
      {highlight && inv.payUrl && (
        <a
          href={inv.payUrl}
          className="focus-ring shrink-0 inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-xl px-3.5 py-2 transition-colors"
        >
          Pagar <ArrowRight className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
};
