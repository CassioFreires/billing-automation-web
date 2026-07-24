import React, { useState } from "react";
import { Store, Loader2, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { isAxiosError } from "axios";
import { useOffers, useOfferSummary, useCreateOffer, useUpdateOffer, useDeleteOffer } from "../../hooks/useOffers";
import type { Offer, OfferType } from "../../services/offers.service";
import { formatBRL } from "../../lib/format";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) {
    const e = err.response.data.error;
    return typeof e === "string" ? e : fallback;
  }
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

const TYPE_LABEL: Record<OfferType, string> = { addon: "Add-on", upgrade: "Upgrade", produto: "Produto" };

/** Converte "60,00" / "60" / "60.5" (reais) → centavos inteiros. */
function reaisToCents(v: string): number {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

/**
 * Loja no Pagamento (spec 0044, F15). O dono cadastra ofertas (add-on/upgrade/
 * produto) que aparecem na página de pagamento do Elo como "order bump". Aceitar
 * gera uma cobrança separada — receita nova sem vender na mão.
 */
export const OfferSettings: React.FC = () => {
  const { data: offers, isLoading } = useOffers();
  const { data: summary } = useOfferSummary();
  const create = useCreateOffer();
  const update = useUpdateOffer();
  const remove = useDeleteOffer();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<OfferType>("addon");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const inputClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const priceCents = reaisToCents(price);
    if (name.trim().length < 2) return setError("Dê um nome à oferta.");
    if (priceCents <= 0) return setError("Informe um preço maior que zero.");
    try {
      await create.mutateAsync({ name: name.trim(), priceCents, type });
      setName("");
      setPrice("");
      setType("addon");
      setSaved(true);
    } catch (err) {
      setError(apiError(err, "Erro ao criar a oferta."));
    }
  };

  return (
    <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
        <Store className="h-4 w-4" />
        Loja no Pagamento (vender junto no checkout)
      </div>
      <p className="text-xs text-text-muted mb-5">
        Ofereça um extra na página de pagamento — quando o cliente vai pagar, vê a oferta e aceita em 1 toque.
        Aceitar gera uma <strong>cobrança separada</strong> do extra. Receita nova sem vender na mão.
      </p>

      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="rounded-xl border border-border-subtle bg-bg-main/40 px-3 py-2.5">
            <div className="text-lg font-bold tabular-nums">{summary.activeOffers}</div>
            <div className="text-[11px] text-text-muted">ofertas ativas</div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-main/40 px-3 py-2.5">
            <div className="text-lg font-bold tabular-nums">{summary.paidPurchases}</div>
            <div className="text-[11px] text-text-muted">vendas pagas</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
            <div className="text-lg font-bold tabular-nums text-brand-success">{formatBRL(summary.revenueCents / 100)}</div>
            <div className="text-[11px] text-text-muted">receita extra</div>
          </div>
        </div>
      )}

      {/* Lista de ofertas */}
      {isLoading ? (
        <div className="h-24 rounded-xl bg-bg-main/60 animate-pulse mb-5" />
      ) : offers && offers.length > 0 ? (
        <ul className="space-y-2 mb-5">
          {offers.map((o: Offer) => (
            <li
              key={o.id}
              className="flex items-center gap-3 rounded-xl border border-border-subtle px-3.5 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{o.name}</div>
                <div className="text-xs text-text-muted">
                  {formatBRL(o.priceCents / 100)} · {TYPE_LABEL[o.type]}
                </div>
              </div>
              {/* Toggle ativo/inativo */}
              <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="accent-brand-primary h-4 w-4"
                  checked={o.active}
                  onChange={(e) => update.mutate({ id: o.id, body: { active: e.target.checked } })}
                />
                {o.active ? "ativa" : "inativa"}
              </label>
              <button
                type="button"
                onClick={() => remove.mutate(o.id)}
                disabled={remove.isPending}
                title="Apagar (ofertas já vendidas não podem ser apagadas — desative)"
                className="focus-ring shrink-0 text-rose-300 hover:text-rose-200 rounded-lg p-1.5 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-faint mb-5">Nenhuma oferta ainda. Crie a primeira abaixo.</p>
      )}

      {remove.isError && (
        <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5 mb-4">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{apiError(remove.error, "Erro ao apagar a oferta.")}</span>
        </div>
      )}

      {/* Nova oferta */}
      <form onSubmit={submit} className="space-y-3 border-t border-border-subtle pt-4">
        <div className="text-xs font-medium text-text-muted uppercase tracking-wider">Nova oferta</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Personal 1x/semana"
          />
          <input
            className={`${inputClass} sm:max-w-[9rem]`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="R$ 60,00"
          />
          <select
            className={`${inputClass} sm:max-w-[9rem]`}
            value={type}
            onChange={(e) => setType(e.target.value as OfferType)}
          >
            <option value="addon">Add-on</option>
            <option value="upgrade">Upgrade</option>
            <option value="produto">Produto</option>
          </select>
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
            Oferta criada. Já aparece no checkout.
          </div>
        )}

        <button
          type="submit"
          disabled={create.isPending}
          className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar oferta
        </button>
      </form>
    </div>
  );
};
