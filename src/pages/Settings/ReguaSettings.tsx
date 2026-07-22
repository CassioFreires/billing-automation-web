import React, { useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { isAxiosError } from "axios";
import { useReguaSettings, useUpdateReguaSettings } from "../../hooks/useSettings";
import type { ReguaStep } from "../../services/settings.service";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

/** Sugestão inicial quando o tenant liga a régua pela primeira vez. */
const SUGGESTED: ReguaStep[] = [
  { offsetDays: -3, message: "Olá {nome}, sua cobrança de {valor} vence em 3 dias." },
  { offsetDays: 0, message: "Olá {nome}, sua cobrança de {valor} vence hoje." },
  { offsetDays: 3, message: "Olá {nome}, sua cobrança de {valor} está vencida há 3 dias." },
];

/** Rótulo humano do offset (antes/no dia/depois do vencimento). */
function offsetLabel(d: number): string {
  if (d < 0) return `${Math.abs(d)} dia(s) antes`;
  if (d === 0) return "no vencimento";
  return `${d} dia(s) depois`;
}

/** Seção "Régua de cobrança" das Configurações (spec 0026). */
export const ReguaSettings: React.FC = () => {
  const { data, isLoading } = useReguaSettings();
  const update = useUpdateReguaSettings();

  const [enabled, setEnabled] = useState(false);
  const [steps, setSteps] = useState<ReguaStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setSteps(data.steps.length ? data.steps : []);
    }
  }, [data]);

  const setStep = (i: number, patch: Partial<ReguaStep>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addStep = () => {
    const last = steps.length ? steps[steps.length - 1].offsetDays : -3;
    setSteps((prev) => [...prev, { offsetDays: last + 3, message: "" }]);
  };

  const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const useSuggested = () => setSteps(SUGGESTED);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    // Ordena por offset e valida crescente/único antes de enviar (espelha o backend).
    const ordered = [...steps].sort((a, b) => a.offsetDays - b.offsetDays);
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].offsetDays === ordered[i - 1].offsetDays) {
        setError("Dois passos não podem ter o mesmo dia. Ajuste os offsets.");
        return;
      }
    }
    if (enabled && ordered.length === 0) {
      setError("Adicione ao menos um passo para ligar a régua.");
      return;
    }

    try {
      await update.mutateAsync({
        enabled,
        steps: ordered.map((s) => ({
          offsetDays: s.offsetDays,
          message: s.message?.trim() ? s.message.trim() : undefined,
        })),
      });
      setSteps(ordered);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(apiError(err, "Não foi possível salvar a régua."));
    }
  };

  const input =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  return (
    <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
        <CalendarClock className="h-4 w-4" /> Régua de cobrança
      </div>
      <p className="text-text-muted text-sm mb-5">
        Uma sequência de lembretes enviada automaticamente conforme o vencimento. Use{" "}
        <code className="text-xs bg-bg-main/60 px-1.5 py-0.5 rounded">{"{nome}"}</code> e{" "}
        <code className="text-xs bg-bg-main/60 px-1.5 py-0.5 rounded">{"{valor}"}</code> na mensagem.
      </p>

      {isLoading && !data ? (
        <div className="h-32 rounded-xl bg-bg-main/60 animate-pulse" />
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="focus-ring h-4 w-4 rounded border-border-subtle bg-bg-main/60 accent-brand-primary"
            />
            <div>
              <div className="text-sm font-medium">Ativar régua automática</div>
              <div className="text-xs text-text-muted">
                Com isto desligado, os lembretes seguem o modo simples (um envio por varredura).
              </div>
            </div>
          </label>

          {enabled && (
            <div className="space-y-3 animate-fade-in">
              {steps.length === 0 && (
                <div className="text-sm text-text-muted flex items-center justify-between gap-3 bg-bg-main/40 border border-border-subtle rounded-xl px-3.5 py-3">
                  <span>Nenhum passo ainda.</span>
                  <button type="button" onClick={useSuggested} className="focus-ring text-brand-primary font-medium hover:text-brand-hover">
                    Usar sugestão
                  </button>
                </div>
              )}

              {steps.map((s, i) => (
                <div key={i} className="rounded-xl border border-border-subtle p-3.5 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={s.offsetDays}
                        onChange={(e) => setStep(i, { offsetDays: parseInt(e.target.value || "0", 10) })}
                        className="focus-ring w-20 bg-bg-main/60 border border-border-subtle rounded-lg px-2.5 py-1.5 text-sm font-mono"
                        min={-30}
                        max={90}
                      />
                      <span className="text-xs text-text-muted">dias · {offsetLabel(s.offsetDays)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="focus-ring ml-auto text-text-faint hover:text-rose-400 rounded-lg p-1.5"
                      aria-label="Remover passo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={s.message ?? ""}
                    onChange={(e) => setStep(i, { message: e.target.value })}
                    placeholder="Mensagem (opcional) — ex.: Olá {nome}, sua cobrança de {valor}…"
                    className={input}
                    maxLength={500}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addStep}
                className="focus-ring inline-flex items-center gap-2 text-sm text-brand-primary hover:text-brand-hover font-medium"
              >
                <Plus className="h-4 w-4" /> Adicionar passo
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={update.isPending}
              className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
            {saved && (
              <span className="text-sm text-brand-success flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Régua salva
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
