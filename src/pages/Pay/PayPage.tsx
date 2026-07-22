import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  CalendarClock,
  CreditCard,
  BadgePercent,
} from "lucide-react";
import agreementsService from "../../services/agreements.service";
import type {
  AgreementOption,
  AgreementOptionType,
  AgreementNewInvoice,
  AcceptAgreementResponse,
} from "../../services/agreements.service";
import { Logo } from "../../components/Logo";
import { formatBRL, formatDate } from "../../lib/format";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

const OPTION_META: Record<
  AgreementOptionType,
  { icon: React.ElementType; title: string; accent: string }
> = {
  discount: { icon: BadgePercent, title: "Pagar à vista com desconto", accent: "text-brand-success" },
  installments: { icon: CreditCard, title: "Parcelar", accent: "text-brand-primary" },
  defer: { icon: CalendarClock, title: "Adiar o vencimento", accent: "text-brand-warning" },
};

function optionSubtitle(o: AgreementOption): string {
  if (o.type === "discount") return `${Math.round((o.discountPercent ?? 0) * 100)}% de desconto no pagamento imediato`;
  if (o.type === "installments") return `${o.installments}x de ${formatBRL(o.installmentValue ?? 0)} sem complicação`;
  if (o.type === "defer")
    return `Novo vencimento em ${formatDate(o.newDueDate)}${(o.feePercent ?? 0) > 0 ? ` (+${Math.round((o.feePercent ?? 0) * 100)}%)` : ""}`;
  return "";
}

/** Caixa de PIX copia-e-cola com botão de copiar. */
const PixBox: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível — o usuário seleciona manualmente */
    }
  };
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">PIX copia e cola</span>
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
    </div>
  );
};

export const PayPage: React.FC = () => {
  const { token = "" } = useParams<{ token: string }>();
  const [accepted, setAccepted] = useState<AcceptAgreementResponse | null>(null);
  const [pix, setPix] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pay-options", token],
    queryFn: () => agreementsService.getOptions(token),
    enabled: Boolean(token),
    retry: false,
  });

  const acceptMut = useMutation({
    mutationFn: (body: { type: AgreementOptionType; installments?: number }) =>
      agreementsService.accept(token, body),
    onSuccess: (res) => {
      setAccepted(res);
      setPix(null);
      setPayError(null);
    },
  });

  const payAttemptMut = useMutation({
    mutationFn: () => agreementsService.payAttempt(token),
  });

  // Vai para o destino de pagamento: checkout hospedado (redireciona) ou PIX (mostra).
  const goPay = (target: { checkoutUrl: string | null; pixCopyPaste: string | null }) => {
    setPayError(null);
    if (target.checkoutUrl) {
      window.location.href = target.checkoutUrl;
      return;
    }
    if (target.pixCopyPaste) {
      setPix(target.pixCopyPaste);
      return;
    }
    setPayError("Forma de pagamento indisponível. Fale com quem enviou a cobrança.");
  };

  // Pagar a cobrança ORIGINAL: registra pay_attempt e segue para o destino.
  const payOriginal = async () => {
    try {
      const dest = await payAttemptMut.mutateAsync();
      goPay(dest);
    } catch (err) {
      setPayError(apiError(err, "Não foi possível iniciar o pagamento."));
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size={40} />
        </div>
        {children}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-text-faint">
          <ShieldCheck className="h-3.5 w-3.5" />
          Pagamento seguro via Adimplo
        </p>
        <p className="mt-2 text-center text-[11px] text-text-faint">
          Seus dados são tratados conforme a{" "}
          <a href="/privacidade" target="_blank" rel="noreferrer" className="underline hover:text-text-muted">
            Política de Privacidade
          </a>
          . Não guardamos seu IP.
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
      <div className={`${card} text-center space-y-2`}>
        <AlertCircle className="h-8 w-8 mx-auto text-brand-danger" />
        <h1 className="text-lg font-bold">Link inválido ou expirado</h1>
        <p className="text-sm text-text-muted">Confira o link ou fale com quem enviou a cobrança.</p>
      </div>
    );
  }

  // Fatura já paga.
  if (data.invoice.status === "PAID") {
    return shell(
      <div className={`${card} text-center space-y-2`}>
        <CheckCircle2 className="h-10 w-10 mx-auto text-brand-success" />
        <h1 className="text-lg font-bold">Cobrança paga</h1>
        <p className="text-sm text-text-muted">Está tudo certo. Obrigado!</p>
      </div>
    );
  }

  // Já existe acordo (aqui ou vindo de aceite agora): pagar a NOVA cobrança.
  const activeNew: AgreementNewInvoice | null = accepted?.newInvoice ?? data.activeAgreement?.newInvoice ?? null;

  if (activeNew) {
    return shell(
      <div className={`${card} space-y-5`}>
        <div className="flex items-center gap-2 text-brand-success text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {accepted ? "Acordo confirmado!" : "Você já tem um acordo em aberto"}
        </div>
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Valor a pagar</div>
          <div className="text-3xl font-extrabold tracking-tight mt-1">{formatBRL(activeNew.value)}</div>
          <div className="text-sm text-text-muted mt-1">Vencimento {formatDate(activeNew.dueDate)}</div>
        </div>

        {pix ? (
          <PixBox code={pix} />
        ) : (
          <button
            onClick={() => goPay(activeNew)}
            className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <CreditCard className="h-4 w-4" />
            Pagar agora
          </button>
        )}
        {payError && <p className="text-xs text-brand-danger">{payError}</p>}
      </div>
    );
  }

  // Fluxo normal: pagar ou (se hesitando) escolher uma opção de alívio.
  return shell(
    <div className="space-y-4">
      <div className={`${card} space-y-5`}>
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Valor da cobrança</div>
          <div className="text-3xl font-extrabold tracking-tight mt-1">{formatBRL(data.invoice.value)}</div>
          <div className="text-sm text-text-muted mt-1">Vencimento {formatDate(data.invoice.dueDate)}</div>
        </div>

        {pix ? (
          <PixBox code={pix} />
        ) : (
          <button
            onClick={payOriginal}
            disabled={payAttemptMut.isPending}
            className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {payAttemptMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Pagar agora
          </button>
        )}
        {payError && <p className="text-xs text-brand-danger">{payError}</p>}
      </div>

      {/* Botão de Alívio de Caixa — só quando o pagador está hesitando (spec 0018). */}
      {data.reliefAvailable && data.options.length > 0 && (
        <div className={`${card} space-y-4 animate-fade-in-up`}>
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Essa semana está apertada?</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Escolha uma condição que caiba no seu bolso — sem precisar falar com ninguém.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.options.map((o) => {
              const meta = OPTION_META[o.type];
              const Icon = meta.icon;
              const isThis = acceptMut.isPending && acceptMut.variables?.type === o.type;
              return (
                <button
                  key={o.type}
                  onClick={() => acceptMut.mutate({ type: o.type, installments: o.installments })}
                  disabled={acceptMut.isPending}
                  className="focus-ring w-full text-left border border-border-subtle hover:border-brand-primary/60 hover:bg-bg-elevated/40 rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  <div className={`shrink-0 ${meta.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{meta.title}</div>
                    <div className="text-xs text-text-muted">{optionSubtitle(o)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{formatBRL(o.finalValue)}</div>
                    {isThis && <Loader2 className="h-3.5 w-3.5 animate-spin ml-auto mt-0.5 text-brand-primary" />}
                  </div>
                </button>
              );
            })}
          </div>

          {acceptMut.isError && (
            <p className="text-xs text-brand-danger">{apiError(acceptMut.error, "Não foi possível criar o acordo.")}</p>
          )}
          <p className="text-[11px] text-text-faint text-center">Condições oferecidas por quem emitiu a cobrança.</p>
        </div>
      )}
    </div>
  );
};
