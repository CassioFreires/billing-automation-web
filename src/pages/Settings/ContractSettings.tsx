import React, { useEffect, useState } from "react";
import { FileSignature, Loader2, CheckCircle2 } from "lucide-react";
import { useContractSettings, useUpdateContractSettings } from "../../hooks/useContract";

/**
 * Contrato no Celular (spec 0040, F14). O dono escreve o contrato de adesão; o
 * cliente assina no Portal. Editar o texto sobe a versão (aceites antigos valem
 * para a versão que assinaram).
 */
export const ContractSettings: React.FC = () => {
  const { data, isLoading } = useContractSettings();
  const update = useUpdateContractSettings();

  const [form, setForm] = useState({ enabled: false, title: "", body: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm({ enabled: data.enabled, title: data.title, body: data.body });
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
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
          <FileSignature className="h-4 w-4" />
          Contrato no celular
        </div>
        {data && <span className="text-xs text-text-faint">versão {data.version}</span>}
      </div>
      <p className="text-xs text-text-muted mb-5">
        Escreva o contrato de adesão. O cliente assina no <strong>Portal</strong> (link do pagador), pelo celular,
        com registro de prova (nome, data, versão). É a base legal para cobrar, reter e bloquear acesso.
      </p>

      {isLoading ? (
        <div className="h-56 rounded-xl bg-bg-main/60 animate-pulse" />
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
              <div className="text-sm font-medium">Exigir aceite do contrato</div>
              <div className="text-xs text-text-muted">Com ativado, o contrato aparece no Portal do pagador para assinatura.</div>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Título</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contrato de prestação de serviço"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Texto do contrato</span>
            <textarea
              className={`${inputClass} min-h-[180px] resize-y font-mono text-xs leading-relaxed`}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={"1. Do objeto...\n2. Do pagamento...\n3. Do cancelamento e bloqueio de acesso..."}
            />
            <span className="text-xs text-text-faint">Ao alterar o texto, a versão sobe — quem já assinou continua válido na versão anterior.</span>
          </label>

          {saved && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-sm rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Contrato salvo.
            </div>
          )}

          <button
            type="submit"
            disabled={update.isPending}
            className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar contrato
          </button>
        </form>
      )}
    </div>
  );
};
