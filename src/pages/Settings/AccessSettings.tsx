import React, { useEffect, useState } from "react";
import { Lock, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAccessSettings, useUpdateAccessSettings } from "../../hooks/useAccess";

/**
 * Liga/Desliga o Acesso (spec 0042, F12). Define quando o cliente perde acesso ao
 * serviço por falta de pagamento. Conservador por padrão: só bloqueia quem assinou
 * contrato e passou da carência.
 */
export const AccessSettings: React.FC = () => {
  const { data, isLoading } = useAccessSettings();
  const update = useUpdateAccessSettings();

  const [form, setForm] = useState({ enabled: false, graceDays: 3, requireSignedContract: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const inputClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    try {
      await update.mutateAsync(form);
      setSaved(true);
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
        <Lock className="h-4 w-4" />
        Controle de acesso (pagou libera / não pagou bloqueia)
      </div>
      <p className="text-xs text-text-muted mb-5">
        Define o estado de acesso do cliente ao seu serviço conforme o pagamento. É o motivo mais forte para
        pagar em dia. O bloqueio real (catraca, streaming) vem na integração com aparelhos.
      </p>

      {isLoading ? (
        <div className="h-40 rounded-xl bg-bg-main/60 animate-pulse" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 accent-brand-primary h-4 w-4"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            <div>
              <div className="text-sm font-medium">Ativar controle de acesso</div>
              <div className="text-xs text-text-muted">Desligado, ninguém é bloqueado (padrão seguro).</div>
            </div>
          </label>

          {form.enabled && (
            <div className="space-y-4 pl-1 animate-fade-in">
              <label className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-text-muted text-xs">Bloquear após</span>
                <input
                  type="number"
                  min={0}
                  max={90}
                  className={`${inputClass} max-w-[6rem]`}
                  value={form.graceDays}
                  onChange={(e) => setForm({ ...form, graceDays: Number(e.target.value) })}
                />
                <span className="text-text-muted text-xs">dias de atraso (carência)</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-brand-primary h-4 w-4"
                  checked={form.requireSignedContract}
                  onChange={(e) => setForm({ ...form, requireSignedContract: e.target.checked })}
                />
                <div>
                  <div className="text-sm font-medium">Só bloquear quem assinou o contrato</div>
                  <div className="text-xs text-text-muted">
                    Recomendado. Sem contrato assinado, o cliente <strong>não</strong> é bloqueado (respaldo legal).
                  </div>
                </div>
              </label>

              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-brand-warning text-xs rounded-xl px-3.5 py-2.5">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Quem está em dia nunca é bloqueado. Você pode liberar/bloquear manualmente cada cliente na tela de Clientes.</span>
              </div>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-sm rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Controle de acesso salvo.
            </div>
          )}

          <button
            type="submit"
            disabled={update.isPending}
            className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </form>
      )}
    </div>
  );
};
