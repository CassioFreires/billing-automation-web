import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Users, Loader2, AlertCircle, UploadCloud, Link as LinkIcon, Check } from "lucide-react";
import { isAxiosError } from "axios";
import { Modal } from "../../components/ui/Modal";
import portalService from "../../services/portal.service";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "../../hooks/useClients";
import type { Client, ClientInput } from "../../services/clientes.service";
import { ImportWizard } from "./ImportWizard";

const EMPTY_FORM: ClientInput = { name: "", phone: "", document: "" };

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

export const ClientsPage: React.FC = () => {
  const { data: clients = [], isLoading, error } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [portalCopiedId, setPortalCopiedId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.document.includes(q)
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, document: c.document });
    setFormError(null);
    setFormOpen(true);
  };

  /** Gera/recupera o link do Portal do pagador e copia para a área de transferência (spec 0027). */
  const copyPortalLink = async (c: Client) => {
    try {
      const url = await portalService.getPortalLink(c.id);
      await navigator.clipboard.writeText(url);
      setPortalCopiedId(c.id);
      setTimeout(() => setPortalCopiedId((id) => (id === c.id ? null : id)), 2000);
    } catch {
      /* silencioso: se falhar a cópia, o dono pode tentar de novo */
    }
  };

  // Deep-link do onboarding (spec 0021): /clients?new=1 abre o modal de criação
  // e limpa o parâmetro para não reabrir ao recarregar.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openCreate();
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.name.trim().length < 3) return setFormError("Nome deve ter ao menos 3 caracteres.");
    if (form.phone.replace(/\D/g, "").length < 10) return setFormError("Telefone inválido (mín. 10 dígitos).");
    if (form.document.trim().length < 11) return setFormError("Documento inválido (mín. 11 caracteres).");

    try {
      if (editing) {
        await updateClient.mutateAsync({ id: editing.id, data: form });
      } else {
        await createClient.mutateAsync(form);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(apiError(err, "Erro ao salvar o cliente."));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteClient.mutateAsync(toDelete.id);
      setToDelete(null);
    } catch {
      // mantém o modal; poderia exibir erro
    }
  };

  const saving = createClient.isPending || updateClient.isPending;
  const inputClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  return (
    <div className="space-y-6 animate-fade-in mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Clientes</h1>
          <p className="text-text-muted text-sm mt-1">Gerencie os clientes da sua conta.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportOpen(true)}
            className="focus-ring border border-border-subtle hover:bg-bg-elevated text-text-muted hover:text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <UploadCloud className="h-4 w-4" /> Importar CSV
          </button>
          <button
            onClick={openCreate}
            className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-500/10"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-bg-card/50 border border-border-subtle/80 p-4 rounded-xl flex items-center gap-3">
        <Search className="h-5 w-5 text-text-faint" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou documento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm w-full focus:outline-none placeholder-text-faint"
        />
      </div>

      {/* Conteúdo */}
      {error ? (
        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
          Não foi possível carregar os clientes.
        </div>
      ) : (
        <div className="bg-bg-card/40 border border-border-subtle/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-card/80 border-b border-border-subtle text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Documento</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-sm">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="p-3">
                        <div className="h-8 rounded-lg bg-bg-main/60 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-10 text-text-muted">
                      {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-bg-elevated/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary shrink-0">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-medium group-hover:text-brand-primary transition-colors">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-text-muted font-mono text-xs">{c.phone}</td>
                      <td className="p-4 text-text-muted font-mono text-xs">{c.document}</td>
                      <td className="p-4">
                        {c.status === "EM_ATRASO" ? (
                          <span className="text-brand-warning bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">Em atraso</span>
                        ) : (
                          <span className="text-brand-success bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">Em dia</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => copyPortalLink(c)}
                            className="focus-ring p-2 rounded-lg text-text-muted hover:text-brand-primary hover:bg-sky-500/10 transition-all"
                            aria-label="Copiar link do portal"
                            title="Copiar link do portal do pagador"
                          >
                            {portalCopiedId === c.id ? <Check className="h-4 w-4 text-brand-success" /> : <LinkIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="focus-ring p-2 rounded-lg text-text-muted hover:text-white hover:bg-bg-elevated transition-all"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setToDelete(c)}
                            className="focus-ring p-2 rounded-lg text-text-muted hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar cliente" : "Novo cliente"}>
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Nome</span>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Telefone (com DDI/DDD)</span>
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="5511999998888" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Documento (CPF/CNPJ)</span>
            <input className={inputClass} value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder="12345678901" />
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assistente de importação CSV */}
      <ImportWizard open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Modal excluir */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Excluir cliente">
        <p className="text-sm text-text-muted">
          Tem certeza que deseja excluir <span className="text-white font-medium">{toDelete?.name}</span>? Essa ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 pt-5">
          <button onClick={() => setToDelete(null)} className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all">
            Cancelar
          </button>
          <button onClick={confirmDelete} disabled={deleteClient.isPending} className="focus-ring flex-1 bg-brand-danger hover:bg-rose-500 text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60">
            {deleteClient.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
};
