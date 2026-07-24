import React, { useEffect, useState } from "react";
import { HeartHandshake, Loader2, CheckCircle2 } from "lucide-react";
import { useRetentionSettings, useUpdateRetentionSettings } from "../../hooks/useRetention";

/**
 * Config de retenção no cancelamento (spec 0038, F11.1). Define o desconto padrão
 * (% + duração) e liga/desliga as ofertas de pausar/desconto.
 */
export const RetentionSettings: React.FC = () => {
  const { data, isLoading } = useRetentionSettings();
  const update = useUpdateRetentionSettings();

  const [form, setForm] = useState({
    discountPercent: 30,
    discountDurationMonths: 2,
    discountEnabled: true,
    pauseEnabled: true,
  });
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
        <HeartHandshake className="h-4 w-4" />
        Retenção no cancelamento
      </div>
      <p className="text-xs text-text-muted mb-5">
        Quando alguém vai <strong>cancelar</strong> uma assinatura, o Adimplo sugere uma alternativa antes de
        deixar sair. Aqui você define o <strong>desconto padrão</strong> e quais ofertas ficam disponíveis.
      </p>

      {isLoading ? (
        <div className="h-40 rounded-xl bg-bg-main/60 animate-pulse" />
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {/* Desconto */}
          <div className="rounded-xl border border-border-subtle p-3.5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="accent-brand-primary h-4 w-4"
                checked={form.discountEnabled}
                onChange={(e) => setForm({ ...form, discountEnabled: e.target.checked })}
              />
              <span className="text-sm font-medium">Oferecer desconto temporário</span>
            </label>
            {form.discountEnabled && (
              <div className="flex flex-wrap items-center gap-2 text-sm pl-7">
                <span className="text-text-muted text-xs">Desconto padrão de</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className={`${inputClass} max-w-[6rem]`}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                />
                <span className="text-text-muted text-xs">% por</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className={`${inputClass} max-w-[6rem]`}
                  value={form.discountDurationMonths}
                  onChange={(e) => setForm({ ...form, discountDurationMonths: Number(e.target.value) })}
                />
                <span className="text-text-muted text-xs">meses</span>
              </div>
            )}
            <p className="text-xs text-text-faint pl-7">
              Ao aplicar, o desconto entra nas próximas faturas automaticamente e volta ao valor cheio depois.
              O % e a duração podem ser ajustados na hora.
            </p>
          </div>

          {/* Pausar */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 accent-brand-primary h-4 w-4"
              checked={form.pauseEnabled}
              onChange={(e) => setForm({ ...form, pauseEnabled: e.target.checked })}
            />
            <div>
              <div className="text-sm font-medium">Oferecer pausa</div>
              <div className="text-xs text-text-muted">
                "Sua vaga fica guardada." Pausar retém o cliente sem perder margem — a saída preferida.
              </div>
            </div>
          </label>

          {saved && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-sm rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Regras de retenção salvas.
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
