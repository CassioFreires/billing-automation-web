import React, { useEffect, useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { isAxiosError } from "axios";
import { useChannelSettings, useUpdateChannelSettings } from "../../hooks/useSettings";
import type { NotifyChannel } from "../../services/settings.service";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

const OPTIONS: { value: NotifyChannel; label: string; desc: string }[] = [
  { value: "whatsapp", label: "Somente WhatsApp", desc: "As cobranças saem só pelo WhatsApp (padrão)." },
  { value: "email", label: "Somente e-mail", desc: "Saem por e-mail. Cliente sem e-mail cadastrado cai no WhatsApp automaticamente." },
  { value: "both", label: "WhatsApp + e-mail", desc: "Dispara nos dois canais (o e-mail só quando o cliente tem um cadastrado)." },
];

/** Seção "Canal de envio" das Configurações (spec 0032). */
export const ChannelSettings: React.FC = () => {
  const { data, isLoading } = useChannelSettings();
  const update = useUpdateChannelSettings();

  const [channel, setChannel] = useState<NotifyChannel>("whatsapp");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setChannel(data.channel);
  }, [data]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await update.mutateAsync({ channel });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(apiError(err, "Não foi possível salvar o canal de envio."));
    }
  };

  return (
    <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
        <Send className="h-4 w-4" /> Canal de envio
      </div>
      <p className="text-text-muted text-sm mb-5">
        Escolha por onde a régua dispara as cobranças. Para usar e-mail, cadastre o e-mail do cliente na tela de{" "}
        <strong>Clientes</strong>. O e-mail está em <strong>modo simulado</strong> (nada é enviado de verdade ainda).
      </p>

      {isLoading && !data ? (
        <div className="h-32 rounded-xl bg-bg-main/60 animate-pulse" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            {OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  channel === o.value
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-border-subtle hover:bg-bg-elevated/30"
                }`}
              >
                <input
                  type="radio"
                  name="notify-channel"
                  className="mt-1 accent-brand-primary"
                  checked={channel === o.value}
                  onChange={() => setChannel(o.value)}
                />
                <div>
                  <div className="text-sm font-medium">{o.label}</div>
                  <div className="text-xs text-text-muted">{o.desc}</div>
                </div>
              </label>
            ))}
          </div>

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
                <CheckCircle2 className="h-4 w-4" /> Canal salvo
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
