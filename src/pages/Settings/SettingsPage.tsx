import React, { useEffect, useState } from "react";
import { Settings, CreditCard, MessageCircle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { isAxiosError } from "axios";
import {
  usePaymentSettings,
  useUpdatePaymentSettings,
  useWhatsappSettings,
  useUpdateWhatsappSettings,
} from "../../hooks/useSettings";
import type {
  PaymentProvider,
  PaymentSettings,
  WhatsappProvider,
} from "../../services/settings.service";

const PROVIDERS: { value: PaymentProvider; label: string; desc: string }[] = [
  { value: "infinitepay", label: "InfinitePay", desc: "Link de checkout (PIX + cartão). Só precisa do seu handle." },
  { value: "mercadopago", label: "Mercado Pago", desc: "Checkout Pro (em breve — requer token da sua conta)." },
  { value: "mock", label: "Simulado (teste)", desc: "Não cobra de verdade — para testes." },
];

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

export const SettingsPage: React.FC = () => {
  const { data, isLoading } = usePaymentSettings();
  const updatePayment = useUpdatePaymentSettings();

  const [form, setForm] = useState<PaymentSettings>({ provider: "infinitepay", infinitepayHandle: "", redirectUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        provider: data.provider,
        infinitepayHandle: data.infinitepayHandle ?? "",
        redirectUrl: data.redirectUrl ?? "",
      });
    }
  }, [data]);

  // --- WhatsApp ---
  const { data: waData, isLoading: waLoading } = useWhatsappSettings();
  const updateWhatsapp = useUpdateWhatsappSettings();
  const [wForm, setWForm] = useState<{
    provider: WhatsappProvider;
    phoneNumberId: string;
    token: string;
    hasToken: boolean;
  }>({ provider: "log", phoneNumberId: "", token: "", hasToken: false });
  const [wError, setWError] = useState<string | null>(null);
  const [wSaved, setWSaved] = useState(false);

  useEffect(() => {
    if (waData) {
      setWForm({
        provider: waData.provider,
        phoneNumberId: waData.phoneNumberId ?? "",
        token: "", // nunca vem da API; em branco = mantém o salvo
        hasToken: waData.hasToken,
      });
    }
  }, [waData]);

  const submitWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWError(null);
    setWSaved(false);
    if (wForm.provider === "cloud" && !wForm.phoneNumberId.trim()) {
      return setWError("Informe o Phone Number ID da Meta.");
    }
    if (wForm.provider === "cloud" && !wForm.hasToken && !wForm.token.trim()) {
      return setWError("Informe o token da Cloud API (Meta).");
    }
    try {
      await updateWhatsapp.mutateAsync({
        provider: wForm.provider,
        phoneNumberId: wForm.phoneNumberId.trim() || null,
        // só envia token se o usuário digitou um novo (senão mantém o salvo)
        ...(wForm.token.trim() ? { token: wForm.token.trim() } : {}),
      });
      setWSaved(true);
      setWForm((f) => ({ ...f, token: "", hasToken: f.hasToken || Boolean(f.token.trim()) }));
    } catch (err) {
      setWError(apiError(err, "Erro ao salvar o WhatsApp."));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (form.provider === "infinitepay" && !form.infinitepayHandle?.trim()) {
      return setError("Informe o handle do InfinitePay (o nome no seu link de checkout).");
    }
    try {
      await updatePayment.mutateAsync({
        provider: form.provider,
        infinitepayHandle: form.infinitepayHandle?.trim() || null,
        redirectUrl: form.redirectUrl?.trim() || null,
      });
      setSaved(true);
    } catch (err) {
      setError(apiError(err, "Erro ao salvar as configurações."));
    }
  };

  const inputClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  return (
    <div className="animate-fade-in mt-12 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-text-muted text-sm">Meio de pagamento e integrações da sua conta.</p>
        </div>
      </div>

      {/* Pagamento */}
      <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
          <CreditCard className="h-4 w-4" />
          Meio de pagamento
        </div>
        <p className="text-xs text-text-muted mb-5">
          As cobranças da sua conta são geradas no <strong>seu</strong> recebedor. Escolha o provedor e informe suas credenciais.
        </p>

        {isLoading ? (
          <div className="h-40 rounded-xl bg-bg-main/60 animate-pulse" />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Provider */}
            <div className="space-y-2">
              {PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.provider === p.value
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border-subtle hover:bg-bg-elevated/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    className="mt-1 accent-brand-primary"
                    checked={form.provider === p.value}
                    onChange={() => setForm({ ...form, provider: p.value })}
                  />
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-text-muted">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Campos do InfinitePay */}
            {form.provider === "infinitepay" && (
              <div className="space-y-4 pt-1">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Handle do InfinitePay</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-faint font-mono shrink-0">checkout.infinitepay.io/</span>
                    <input
                      className={inputClass}
                      value={form.infinitepayHandle ?? ""}
                      onChange={(e) => setForm({ ...form, infinitepayHandle: e.target.value })}
                      placeholder="seu-handle"
                    />
                  </div>
                  <span className="text-xs text-text-faint">É o nome público que aparece no seu link de pagamento.</span>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">URL de retorno (opcional)</span>
                  <input
                    className={inputClass}
                    value={form.redirectUrl ?? ""}
                    onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
                    placeholder="https://... (para onde o cliente volta após pagar)"
                  />
                </label>
              </div>
            )}

            {form.provider === "mercadopago" && (
              <div className="text-xs text-brand-warning bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
                O Mercado Pago por conta própria ainda está em preparação (guarda de token com segurança). Por enquanto, use o InfinitePay.
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-sm rounded-xl px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Configuração salva. As próximas cobranças usam esse recebedor.
              </div>
            )}

            <button
              type="submit"
              disabled={updatePayment.isPending}
              className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {updatePayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </form>
        )}
      </div>

      {/* WhatsApp */}
      <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </div>
        <p className="text-xs text-text-muted mb-5">
          As cobranças da sua conta são enviadas pelo <strong>seu</strong> número. Em <strong>Simulado</strong>, nada é enviado (só registrado). Em <strong>Meta Cloud API</strong>, envia de verdade com suas credenciais.
        </p>

        {waLoading ? (
          <div className="h-32 rounded-xl bg-bg-main/60 animate-pulse" />
        ) : (
          <form onSubmit={submitWhatsapp} className="space-y-4">
            <div className="space-y-2">
              {(
                [
                  { value: "log", label: "Simulado (log)", desc: "Não envia — apenas registra. Padrão seguro." },
                  { value: "cloud", label: "Meta Cloud API", desc: "Envia de verdade (requer verificação de negócio na Meta)." },
                ] as { value: WhatsappProvider; label: string; desc: string }[]
              ).map((p) => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    wForm.provider === p.value
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border-subtle hover:bg-bg-elevated/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="wa-provider"
                    className="mt-1 accent-brand-primary"
                    checked={wForm.provider === p.value}
                    onChange={() => setWForm({ ...wForm, provider: p.value })}
                  />
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-text-muted">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {wForm.provider === "cloud" && (
              <div className="space-y-4 pt-1">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone Number ID (Meta)</span>
                  <input
                    className={inputClass}
                    value={wForm.phoneNumberId}
                    onChange={(e) => setWForm({ ...wForm, phoneNumberId: e.target.value })}
                    placeholder="ex.: 123456789012345"
                  />
                  <span className="text-xs text-text-faint">É o "Phone number ID" do painel da Meta (não é o telefone).</span>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Token de acesso</span>
                  <input
                    type="password"
                    className={inputClass}
                    value={wForm.token}
                    onChange={(e) => setWForm({ ...wForm, token: e.target.value })}
                    placeholder={wForm.hasToken ? "•••••••• (salvo — deixe em branco para manter)" : "cole o token da Cloud API"}
                  />
                  <span className="text-xs text-text-faint">Guardado com segurança e nunca exibido de volta.</span>
                </label>
              </div>
            )}

            {wError && (
              <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{wError}</span>
              </div>
            )}
            {wSaved && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-sm rounded-xl px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Configuração de WhatsApp salva.
              </div>
            )}

            <button
              type="submit"
              disabled={updateWhatsapp.isPending}
              className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {updateWhatsapp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
