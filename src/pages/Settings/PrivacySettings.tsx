import React, { useState } from "react";
import { ShieldCheck, Download, UserX, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { isAxiosError } from "axios";
import { useClients } from "../../hooks/useClients";
import { useAuth } from "../../auth/AuthContext";
import { Modal } from "../../components/ui/Modal";
import lgpdService, { downloadJson } from "../../services/lgpd.service";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

/**
 * Seção "Privacidade e dados (LGPD)" das Configurações (spec 0022). Reúne os
 * direitos do titular: sobre um cliente (exportar/anonimizar — reusa 0004) e
 * sobre a própria conta (exportar/encerrar).
 */
export const PrivacySettings: React.FC = () => {
  const { data: clients = [] } = useClients();
  const { logout } = useAuth();

  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [anonOpen, setAnonOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setMsg(null);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(apiError(err, "Não foi possível concluir a ação."));
    } finally {
      setBusy(null);
    }
  };

  const exportClient = () =>
    run("exportClient", async () => {
      if (!clientId) return setError("Selecione um cliente.");
      const data = await lgpdService.exportClient(clientId);
      downloadJson(data, `titular-${clientId}.json`);
      setMsg("Dados do titular exportados.");
    });

  const anonymize = () =>
    run("anonymize", async () => {
      await lgpdService.anonymizeClient(clientId);
      setAnonOpen(false);
      setMsg("Titular anonimizado. As faturas foram mantidas sem os dados pessoais.");
    });

  const exportAccount = () =>
    run("exportAccount", async () => {
      const data = await lgpdService.exportAccount();
      downloadJson(data, "conta-adimplo.json");
      setMsg("Dados da conta exportados.");
    });

  const deleteAccount = () =>
    run("deleteAccount", async () => {
      await lgpdService.deleteAccount(confirmName);
      // Conta removida → encerra a sessão e volta para a landing.
      logout();
      window.location.href = "/";
    });

  const label = "text-xs font-medium text-text-muted uppercase tracking-wider";
  const select =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm";

  return (
    <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-primary mb-1">
        <ShieldCheck className="h-4 w-4" /> Privacidade e dados (LGPD)
      </div>
      <p className="text-text-muted text-sm mb-5">
        Exerça os direitos do titular. Ações de escrita registram no histórico.
      </p>

      {(msg || error) && (
        <div
          className={`mb-4 text-sm rounded-xl px-3.5 py-2.5 ${
            error
              ? "bg-brand-danger/10 border border-brand-danger/20 text-rose-300"
              : "bg-brand-success/10 border border-emerald-500/20 text-emerald-300"
          }`}
        >
          {error ?? msg}
        </div>
      )}

      {/* Direitos sobre um titular (cliente) */}
      <div className="space-y-3">
        <span className={label}>Direitos de um cliente (titular)</span>
        <select className={select} value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Selecione um cliente…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.phone}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportClient}
            disabled={!clientId || busy !== null}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-main/50 hover:bg-bg-elevated px-3.5 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy === "exportClient" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar dados
          </button>
          <button
            onClick={() => setAnonOpen(true)}
            disabled={!clientId || busy !== null}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-brand-warning hover:bg-amber-500/15 px-3.5 py-2 text-sm font-medium disabled:opacity-50"
          >
            <UserX className="h-4 w-4" /> Anonimizar
          </button>
        </div>
      </div>

      <hr className="my-6 border-border-subtle/60" />

      {/* Direitos sobre a própria conta */}
      <div className="space-y-3">
        <span className={label}>Dados da sua conta</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportAccount}
            disabled={busy !== null}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-main/50 hover:bg-bg-elevated px-3.5 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy === "exportAccount" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar dados da conta
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={busy !== null}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-brand-danger/30 bg-brand-danger/10 text-rose-300 hover:bg-brand-danger/15 px-3.5 py-2 text-sm font-medium disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Encerrar conta
          </button>
        </div>
      </div>

      {/* Modal — confirmar anonimização */}
      <Modal open={anonOpen} onClose={() => setAnonOpen(false)} title="Anonimizar titular">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Isto remove os dados pessoais de <strong>{selectedClient?.name}</strong> (nome, telefone,
            documento). As faturas são <strong>mantidas</strong> de forma não identificável. A ação
            não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAnonOpen(false)}
              className="focus-ring rounded-xl border border-border-subtle px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={anonymize}
              disabled={busy === "anonymize"}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-warning text-black font-semibold px-4 py-2 text-sm disabled:opacity-60"
            >
              {busy === "anonymize" && <Loader2 className="h-4 w-4 animate-spin" />}
              Anonimizar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — encerrar conta */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Encerrar conta">
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm px-3.5 py-2.5">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Isto apaga <strong>toda a conta</strong> e seus dados (clientes, faturas, recebimentos)
              de forma permanente. Considere <strong>exportar</strong> antes.
            </span>
          </div>
          <label className="block space-y-1.5">
            <span className={label}>Digite o nome da conta para confirmar</span>
            <input
              className={select}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Nome exato da empresa"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteOpen(false)}
              className="focus-ring rounded-xl border border-border-subtle px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={deleteAccount}
              disabled={busy === "deleteAccount" || confirmName.trim().length === 0}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-danger text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
            >
              {busy === "deleteAccount" && <Loader2 className="h-4 w-4 animate-spin" />}
              Encerrar definitivamente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
