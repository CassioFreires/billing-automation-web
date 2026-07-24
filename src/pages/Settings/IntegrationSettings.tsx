import React, { useEffect, useState } from "react";
import {
  Plug, Loader2, CheckCircle2, AlertCircle, Copy, Check, KeyRound, Webhook,
  RefreshCw, Trash2, Send, ArrowRight, ShieldCheck,
} from "lucide-react";
import { isAxiosError } from "axios";
import {
  useAccessIntegration, useSetIntegrationEnabled, useRotateApiKey, useRevokeApiKey,
  useSetWebhook, useClearWebhook, useTestWebhook, useAccessEvents,
} from "../../hooks/useAccess";
import type { AccessEvent } from "../../services/access.service";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) {
    const e = err.response.data.error;
    return typeof e === "string" ? e : fallback;
  }
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

const CopyButton: React.FC<{ value: string; label?: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* ignore */ }
      }}
      className="focus-ring shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:text-brand-hover rounded-lg px-2 py-1 border border-border-subtle"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : label ?? "Copiar"}
    </button>
  );
};

const STATE_PILL: Record<string, { label: string; cls: string }> = {
  allowed: { label: "Liberado", cls: "bg-emerald-500/10 text-brand-success border-emerald-500/20" },
  grace: { label: "Carência", cls: "bg-amber-500/10 text-brand-warning border-amber-500/20" },
  blocked: { label: "Bloqueado", cls: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
};

const WEBHOOK_PILL: Record<string, { label: string; cls: string }> = {
  sent: { label: "entregue", cls: "text-brand-success" },
  failed: { label: "falhou", cls: "text-rose-300" },
  skipped: { label: "não enviado", cls: "text-text-faint" },
};

/**
 * Conexão IoT/Catracas (spec 0043, F13). A "tomada": credenciais para o
 * equipamento (catraca/streaming) consultar o acesso (API key) e para o Adimplo
 * avisar quando o acesso muda (webhook de saída, assinado). Log das transições.
 */
export const IntegrationSettings: React.FC = () => {
  const { data, isLoading } = useAccessIntegration();
  const setEnabled = useSetIntegrationEnabled();
  const rotate = useRotateApiKey();
  const revoke = useRevokeApiKey();
  const setWebhook = useSetWebhook();
  const clearWebhook = useClearWebhook();
  const testWebhook = useTestWebhook();
  const { data: events } = useAccessEvents(20);

  const [url, setUrl] = useState("");
  const [freshKey, setFreshKey] = useState<string | null>(null); // chave crua, mostrada 1x
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data) setUrl(data.webhookUrl ?? "");
  }, [data]);

  const inputClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";
  const checkUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/access/check?client=CLIENT_ID`;

  const doRotate = async () => {
    setError(null); setMsg(null); setFreshKey(null);
    try {
      const res = await rotate.mutateAsync();
      setFreshKey(res.apiKey);
    } catch (err) { setError(apiError(err, "Erro ao gerar a chave.")); }
  };
  const doTest = async () => {
    setError(null); setMsg(null);
    try {
      const res = await testWebhook.mutateAsync();
      if (res.status === "sent") setMsg(`Webhook de teste entregue (HTTP ${res.code}).`);
      else setError(`Webhook de teste falhou${res.code ? ` (HTTP ${res.code})` : ""}${res.error ? `: ${res.error}` : ""}.`);
    } catch (err) { setError(apiError(err, "Erro ao testar o webhook.")); }
  };
  const doSaveWebhook = async () => {
    setError(null); setMsg(null);
    try {
      await setWebhook.mutateAsync(url.trim());
      setMsg("Webhook salvo.");
    } catch (err) { setError(apiError(err, "URL inválida ou erro ao salvar.")); }
  };

  return (
    <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
        <Plug className="h-4 w-4" />
        Integrações (catraca / streaming / IoT)
      </div>
      <p className="text-xs text-text-muted mb-5">
        A "tomada" que faz o <strong>controle de acesso agir no mundo real</strong>. O equipamento pergunta
        ao Adimplo se libera (API key), e o Adimplo avisa o seu sistema quando o acesso de um cliente muda
        (webhook). Requer o <strong>Controle de acesso</strong> ligado logo acima.
      </p>

      {isLoading || !data ? (
        <div className="h-40 rounded-xl bg-bg-main/60 animate-pulse" />
      ) : (
        <div className="space-y-6">
          {/* Master toggle */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 accent-brand-primary h-4 w-4"
              checked={data.enabled}
              onChange={(e) => setEnabled.mutate(e.target.checked)}
            />
            <div>
              <div className="text-sm font-medium">Ativar integração de acesso</div>
              <div className="text-xs text-text-muted">
                Desligada, a API key não responde e nenhum webhook é disparado (padrão seguro).
              </div>
            </div>
          </label>

          {/* API key (PULL) */}
          <div className="rounded-xl border border-border-subtle p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4 text-text-muted" />
              Chave de API (o equipamento consulta)
            </div>

            {freshKey ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                  <code className="text-xs text-brand-success break-all font-mono">{freshKey}</code>
                  <CopyButton value={freshKey} />
                </div>
                <p className="text-xs text-brand-warning flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Copie agora — por segurança, esta chave <strong>não será mostrada de novo</strong>.
                </p>
              </div>
            ) : data.hasApiKey ? (
              <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                <span>Chave ativa: <code className="font-mono text-text-main">{data.apiKeyPrefix}…</code></span>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Nenhuma chave gerada. Gere uma para o equipamento consultar.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={doRotate}
                disabled={rotate.isPending}
                className="focus-ring inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-primary hover:bg-brand-hover text-white rounded-lg px-3 py-1.5 disabled:opacity-60"
              >
                {rotate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {data.hasApiKey ? "Gerar nova (revoga a atual)" : "Gerar chave"}
              </button>
              {data.hasApiKey && (
                <button
                  type="button"
                  onClick={() => { setFreshKey(null); revoke.mutate(); }}
                  disabled={revoke.isPending}
                  className="focus-ring inline-flex items-center gap-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 rounded-lg px-3 py-1.5 border border-border-subtle disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Revogar
                </button>
              )}
            </div>

            <div className="text-xs text-text-faint bg-bg-main/40 border border-border-subtle rounded-xl px-3 py-2.5 space-y-1.5">
              <div className="text-text-muted">Como o equipamento pergunta:</div>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono break-all">GET {checkUrl}</code>
                <CopyButton value={checkUrl} />
              </div>
              <div>Header: <code className="font-mono">x-api-key: SUA_CHAVE</code></div>
              <div>Resposta: <code className="font-mono">{`{ "granted": true, "state": "allowed", "reason": "…" }`}</code></div>
            </div>
          </div>

          {/* Webhook (PUSH) */}
          <div className="rounded-xl border border-border-subtle p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Webhook className="h-4 w-4 text-text-muted" />
              Webhook de saída (o Adimplo avisa quando muda)
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">URL do seu sistema</span>
              <input
                className={inputClass}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://seu-sistema.com/webhooks/adimplo"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={doSaveWebhook}
                disabled={setWebhook.isPending || !url.trim()}
                className="focus-ring inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-primary hover:bg-brand-hover text-white rounded-lg px-3 py-1.5 disabled:opacity-60"
              >
                {setWebhook.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar URL
              </button>
              {data.webhookConfigured && (
                <>
                  <button
                    type="button"
                    onClick={doTest}
                    disabled={testWebhook.isPending}
                    className="focus-ring inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:text-brand-hover rounded-lg px-3 py-1.5 border border-border-subtle disabled:opacity-60"
                  >
                    {testWebhook.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Enviar teste
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUrl(""); clearWebhook.mutate(); }}
                    disabled={clearWebhook.isPending}
                    className="focus-ring inline-flex items-center gap-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 rounded-lg px-3 py-1.5 border border-border-subtle disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </button>
                </>
              )}
            </div>

            {data.webhookSecret && (
              <div className="text-xs text-text-faint bg-bg-main/40 border border-border-subtle rounded-xl px-3 py-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <ShieldCheck className="h-3.5 w-3.5" /> Segredo de assinatura (valide do seu lado)
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono break-all text-text-main">{data.webhookSecret}</code>
                  <CopyButton value={data.webhookSecret} />
                </div>
                <div>
                  Cada POST vem com <code className="font-mono">x-adimplo-signature: sha256=…</code> (HMAC de
                  <code className="font-mono"> timestamp.corpo</code>) e <code className="font-mono">x-adimplo-timestamp</code>.
                  Confira a assinatura para garantir que veio do Adimplo.
                </div>
              </div>
            )}
          </div>

          {(error || msg) && (
            <div
              className={`flex items-start gap-2 text-sm rounded-xl px-3.5 py-2.5 border ${
                error
                  ? "bg-brand-danger/10 border-brand-danger/20 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-brand-success"
              }`}
            >
              {error ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{error ?? msg}</span>
            </div>
          )}

          {/* Log de transições */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider">Últimas mudanças de acesso</div>
            {!events || events.length === 0 ? (
              <p className="text-xs text-text-faint">Nenhuma transição registrada ainda. O sweep roda uma vez por dia.</p>
            ) : (
              <ul className="divide-y divide-border-subtle/60 rounded-xl border border-border-subtle overflow-hidden">
                {events.map((e: AccessEvent) => {
                  const to = STATE_PILL[e.toState] ?? STATE_PILL.allowed;
                  const from = e.fromState ? STATE_PILL[e.fromState] : null;
                  const wh = WEBHOOK_PILL[e.webhookStatus] ?? WEBHOOK_PILL.skipped;
                  return (
                    <li key={e.id} className="flex items-center gap-2 px-3 py-2.5 text-xs">
                      <span className="font-medium text-text-main truncate max-w-[10rem]">{e.clientName}</span>
                      <span className="flex items-center gap-1.5 ml-auto shrink-0">
                        {from && <span className={`px-1.5 py-0.5 rounded border ${from.cls}`}>{from.label}</span>}
                        <ArrowRight className="h-3 w-3 text-text-faint" />
                        <span className={`px-1.5 py-0.5 rounded border ${to.cls}`}>{to.label}</span>
                      </span>
                      <span className={`shrink-0 ${wh.cls}`} title={e.webhookCode ? `HTTP ${e.webhookCode}` : undefined}>
                        {wh.label}
                      </span>
                      <span className="shrink-0 text-text-faint tabular-nums">
                        {new Date(e.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
