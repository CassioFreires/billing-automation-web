import React, { useEffect, useState } from "react";
import { Settings, CreditCard, MessageCircle, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { isAxiosError } from "axios";
import {
  usePaymentSettings,
  useUpdatePaymentSettings,
  useWhatsappSettings,
  useUpdateWhatsappSettings,
  useNegotiationSettings,
  useUpdateNegotiationSettings,
} from "../../hooks/useSettings";
import type {
  PaymentProvider,
  PaymentCredentials,
  WhatsappProvider,
  NegotiationSettings,
} from "../../services/settings.service";
import { PrivacySettings } from "./PrivacySettings";
import { ReguaSettings } from "./ReguaSettings";
import { ChannelSettings } from "./ChannelSettings";
import { RetentionSettings } from "./RetentionSettings";
import { ContractSettings } from "./ContractSettings";
import { AccessSettings } from "./AccessSettings";
import { IntegrationSettings } from "./IntegrationSettings";
import { OfferSettings } from "./OfferSettings";

const PROVIDERS: { value: PaymentProvider; label: string; desc: string }[] = [
  { value: "infinitepay", label: "InfinitePay", desc: "Link de checkout (PIX + cartão). Só precisa do seu handle." },
  { value: "mercadopago", label: "Mercado Pago", desc: "Checkout Pro — PIX, boleto e cartão. Requer token da sua conta." },
  { value: "asaas", label: "Asaas", desc: "PIX, boleto e cartão. Muito usado por PMEs. Requer API Key." },
  { value: "pagbank", label: "PagBank / PagSeguro", desc: "PIX, boleto e cartão. Requer token de API." },
  { value: "efi", label: "Efí (Gerencianet)", desc: "PIX/boleto/cartão. Requer Client ID e Secret (PIX exige certificado)." },
  { value: "stripe", label: "Stripe", desc: "Checkout internacional. Requer Secret Key e Webhook Secret." },
  { value: "pagarme", label: "Pagar.me", desc: "PIX, boleto e cartão (Stone). Requer Secret Key." },
  { value: "mock", label: "Simulado (teste)", desc: "Não cobra de verdade — para testes." },
];

/** Campos de credencial (write-only) por provider. `secret` mascara no input. */
type CredField = {
  key: keyof PaymentCredentials;
  label: string;
  placeholder?: string;
  help?: string;
  optional?: boolean;
};

const PROVIDER_FIELDS: Record<PaymentProvider, CredField[]> = {
  infinitepay: [], // handle é público, tratado à parte
  mock: [],
  mercadopago: [
    { key: "accessToken", label: "Access Token", help: "Token de acesso da sua conta Mercado Pago." },
    { key: "webhookSecret", label: "Webhook Secret", help: "Chave secreta para validar a assinatura do webhook." },
  ],
  asaas: [
    { key: "apiKey", label: "API Key", help: "Chave de API da sua conta Asaas." },
    { key: "webhookToken", label: "Token do Webhook", help: "Token configurado no painel do Asaas (header asaas-access-token)." },
  ],
  pagbank: [{ key: "token", label: "Token", help: "Token de API do PagBank / PagSeguro." }],
  efi: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret" },
    { key: "webhookToken", label: "Token do Webhook" },
    { key: "certificateBase64", label: "Certificado (base64)", optional: true, help: "Opcional — necessário só para PIX (mTLS)." },
  ],
  stripe: [
    { key: "secretKey", label: "Secret Key", placeholder: "sk_live_... ou sk_test_..." },
    { key: "webhookSecret", label: "Webhook Secret", placeholder: "whsec_..." },
  ],
  pagarme: [
    { key: "secretKey", label: "Secret Key" },
    { key: "webhookSecret", label: "Webhook Secret" },
  ],
};

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

export const SettingsPage: React.FC = () => {
  const { data, isLoading } = usePaymentSettings();
  const updatePayment = useUpdatePaymentSettings();

  const [form, setForm] = useState<{
    provider: PaymentProvider;
    infinitepayHandle: string;
    redirectUrl: string;
  }>({ provider: "infinitepay", infinitepayHandle: "", redirectUrl: "" });
  // Segredos: write-only. Começam em branco; em branco = mantém o salvo.
  const [creds, setCreds] = useState<PaymentCredentials>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        provider: data.provider,
        infinitepayHandle: data.infinitepayHandle ?? "",
        redirectUrl: data.redirectUrl ?? "",
      });
      setCreds({}); // nunca traz segredo da API
    }
  }, [data]);

  // "Está salvo?" só vale quando o provider salvo é o selecionado agora.
  const savedStatus = data && data.provider === form.provider ? data.credentialStatus ?? {} : {};

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
    // Credenciais obrigatórias do provider: exige no 1º cadastro (sem salvo).
    const missing = PROVIDER_FIELDS[form.provider].find(
      (f) => !f.optional && !creds[f.key]?.trim() && !savedStatus[f.key]
    );
    if (missing) {
      return setError(`Informe: ${missing.label}.`);
    }
    // Só envia segredos digitados (em branco = mantém o salvo).
    const credentials: PaymentCredentials = {};
    for (const f of PROVIDER_FIELDS[form.provider]) {
      const v = creds[f.key]?.trim();
      if (v) credentials[f.key] = v;
    }
    try {
      await updatePayment.mutateAsync({
        provider: form.provider,
        infinitepayHandle: form.infinitepayHandle?.trim() || null,
        redirectUrl: form.redirectUrl?.trim() || null,
        ...(Object.keys(credentials).length ? { credentials } : {}),
      });
      setSaved(true);
      setCreds({}); // limpa os inputs de segredo após salvar
    } catch (err) {
      setError(apiError(err, "Erro ao salvar as configurações."));
    }
  };

  // --- Autonegociação (Botão de Alívio — spec 0018) ---
  const { data: negData, isLoading: negLoading } = useNegotiationSettings();
  const updateNegotiation = useUpdateNegotiationSettings();
  // percentuais na UI como inteiros (10 = 10%); convertidos p/ 0..1 ao salvar.
  const [nForm, setNForm] = useState({
    enabled: false,
    hesitationOpens: 3,
    discountEnabled: false,
    discountPercent: 10,
    installmentsEnabled: false,
    maxInstallments: 3,
    deferEnabled: false,
    deferMaxDays: 7,
    deferFeePercent: 0,
  });
  const [nError, setNError] = useState<string | null>(null);
  const [nSaved, setNSaved] = useState(false);

  useEffect(() => {
    if (negData) {
      setNForm({
        enabled: negData.enabled,
        hesitationOpens: negData.hesitationOpens,
        discountEnabled: negData.discountEnabled,
        discountPercent: Math.round((negData.discountPercent ?? 0) * 100),
        installmentsEnabled: negData.installmentsEnabled,
        maxInstallments: negData.maxInstallments,
        deferEnabled: negData.deferEnabled,
        deferMaxDays: negData.deferMaxDays,
        deferFeePercent: Math.round((negData.deferFeePercent ?? 0) * 100),
      });
    }
  }, [negData]);

  const submitNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    setNError(null);
    setNSaved(false);
    const payload: NegotiationSettings = {
      enabled: nForm.enabled,
      hesitationOpens: Number(nForm.hesitationOpens) || 3,
      discountEnabled: nForm.discountEnabled,
      discountPercent: (Number(nForm.discountPercent) || 0) / 100,
      installmentsEnabled: nForm.installmentsEnabled,
      maxInstallments: Number(nForm.maxInstallments) || 1,
      deferEnabled: nForm.deferEnabled,
      deferMaxDays: Number(nForm.deferMaxDays) || 0,
      deferFeePercent: (Number(nForm.deferFeePercent) || 0) / 100,
    };
    try {
      await updateNegotiation.mutateAsync(payload);
      setNSaved(true);
    } catch (err) {
      setNError(apiError(err, "Erro ao salvar as regras de alívio."));
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

            {/* Handle público do InfinitePay */}
            {form.provider === "infinitepay" && (
              <label className="block space-y-1.5 pt-1">
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
            )}

            {/* Credenciais do provider (write-only, mascaradas) */}
            {PROVIDER_FIELDS[form.provider].length > 0 && (
              <div className="space-y-4 pt-1">
                {PROVIDER_FIELDS[form.provider].map((f) => (
                  <label key={f.key} className="block space-y-1.5">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      {f.label}
                      {f.optional && <span className="text-text-faint normal-case"> (opcional)</span>}
                    </span>
                    <input
                      type="password"
                      autoComplete="off"
                      className={inputClass}
                      value={creds[f.key] ?? ""}
                      onChange={(e) => setCreds((c) => ({ ...c, [f.key]: e.target.value }))}
                      placeholder={
                        savedStatus[f.key]
                          ? "•••••••• (salvo — deixe em branco para manter)"
                          : f.placeholder ?? "cole aqui"
                      }
                    />
                    {f.help && <span className="text-xs text-text-faint">{f.help}</span>}
                  </label>
                ))}
              </div>
            )}

            {/* URL de retorno (opcional) — provedores com checkout hospedado */}
            {form.provider !== "mock" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">URL de retorno (opcional)</span>
                <input
                  className={inputClass}
                  value={form.redirectUrl ?? ""}
                  onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
                  placeholder="https://... (para onde o cliente volta após pagar)"
                />
              </label>
            )}

            <div className="text-xs text-text-faint bg-bg-main/40 border border-border-subtle rounded-xl px-3.5 py-2.5">
              🔒 Suas credenciais são <strong>criptografadas</strong> antes de salvar e nunca aparecem de volta nesta tela.
            </div>

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

      {/* Autonegociação — Botão de Alívio de Caixa (spec 0018 — M2) */}
      <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
          <Sparkles className="h-4 w-4" />
          Botão de Alívio de Caixa
        </div>
        <p className="text-xs text-text-muted mb-5">
          Quando um cliente abre o link várias vezes e <strong>não paga</strong> (está "hesitando"), o Adimplo
          oferece <strong>sozinho</strong> uma condição que você define aqui — desconto à vista, parcelamento ou
          novo prazo. Zero negociação no zap.
        </p>

        {negLoading ? (
          <div className="h-40 rounded-xl bg-bg-main/60 animate-pulse" />
        ) : (
          <form onSubmit={submitNegotiation} className="space-y-5">
            {/* Master toggle */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-brand-primary h-4 w-4"
                checked={nForm.enabled}
                onChange={(e) => setNForm({ ...nForm, enabled: e.target.checked })}
              />
              <div>
                <div className="text-sm font-medium">Ativar autonegociação</div>
                <div className="text-xs text-text-muted">Com isto desligado, o link só mostra "Pagar" — sem ofertas.</div>
              </div>
            </label>

            {nForm.enabled && (
              <div className="space-y-5 pl-1 animate-fade-in">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Disparar após quantas aberturas sem pagar
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={`${inputClass} max-w-[8rem]`}
                    value={nForm.hesitationOpens}
                    onChange={(e) => setNForm({ ...nForm, hesitationOpens: Number(e.target.value) })}
                  />
                </label>

                {/* Desconto */}
                <div className="rounded-xl border border-border-subtle p-3.5 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-brand-primary h-4 w-4"
                      checked={nForm.discountEnabled}
                      onChange={(e) => setNForm({ ...nForm, discountEnabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Desconto à vista</span>
                  </label>
                  {nForm.discountEnabled && (
                    <label className="flex items-center gap-2 text-sm pl-7">
                      <span className="text-text-muted text-xs">Desconto de</span>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        className={`${inputClass} max-w-[6rem]`}
                        value={nForm.discountPercent}
                        onChange={(e) => setNForm({ ...nForm, discountPercent: Number(e.target.value) })}
                      />
                      <span className="text-text-muted text-xs">% no pagamento imediato</span>
                    </label>
                  )}
                </div>

                {/* Parcelamento */}
                <div className="rounded-xl border border-border-subtle p-3.5 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-brand-primary h-4 w-4"
                      checked={nForm.installmentsEnabled}
                      onChange={(e) => setNForm({ ...nForm, installmentsEnabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Parcelamento</span>
                  </label>
                  {nForm.installmentsEnabled && (
                    <label className="flex items-center gap-2 text-sm pl-7">
                      <span className="text-text-muted text-xs">Em até</span>
                      <input
                        type="number"
                        min={2}
                        max={24}
                        className={`${inputClass} max-w-[6rem]`}
                        value={nForm.maxInstallments}
                        onChange={(e) => setNForm({ ...nForm, maxInstallments: Number(e.target.value) })}
                      />
                      <span className="text-text-muted text-xs">parcelas</span>
                    </label>
                  )}
                </div>

                {/* Adiar */}
                <div className="rounded-xl border border-border-subtle p-3.5 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-brand-primary h-4 w-4"
                      checked={nForm.deferEnabled}
                      onChange={(e) => setNForm({ ...nForm, deferEnabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Adiar vencimento</span>
                  </label>
                  {nForm.deferEnabled && (
                    <div className="space-y-2.5 pl-7">
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-text-muted text-xs">Adiar em até</span>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          className={`${inputClass} max-w-[6rem]`}
                          value={nForm.deferMaxDays}
                          onChange={(e) => setNForm({ ...nForm, deferMaxDays: Number(e.target.value) })}
                        />
                        <span className="text-text-muted text-xs">dias</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-text-muted text-xs">com taxa de</span>
                        <input
                          type="number"
                          min={0}
                          max={90}
                          className={`${inputClass} max-w-[6rem]`}
                          value={nForm.deferFeePercent}
                          onChange={(e) => setNForm({ ...nForm, deferFeePercent: Number(e.target.value) })}
                        />
                        <span className="text-text-muted text-xs">% (0 = sem taxa)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {nError && (
              <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{nError}</span>
              </div>
            )}
            {nSaved && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-sm rounded-xl px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Regras de alívio salvas.
              </div>
            )}

            <button
              type="submit"
              disabled={updateNegotiation.isPending}
              className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {updateNegotiation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </form>
        )}
      </div>

      {/* Loja no Pagamento (spec 0044, F15) */}
      <OfferSettings />

      {/* Canal de envio das cobranças (spec 0032) */}
      <ChannelSettings />

      {/* Régua de cobrança multi-passo (spec 0026) */}
      <ReguaSettings />

      {/* Retenção no cancelamento (spec 0038, F11.1) */}
      <RetentionSettings />

      {/* Contrato no celular (spec 0040, F14) */}
      <ContractSettings />

      {/* Controle de acesso (spec 0042, F12) */}
      <AccessSettings />

      {/* Conexão IoT/Catracas (spec 0043, F13) */}
      <IntegrationSettings />

      {/* Privacidade e dados (LGPD, spec 0022) */}
      <PrivacySettings />
    </div>
  );
};
