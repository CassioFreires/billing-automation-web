import React, { useState } from "react";
import { UsersRound, Plus, Trash2, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { isAxiosError } from "axios";
import { Modal } from "../../components/ui/Modal";
import { useTeam, useInviteMember, useChangeRole, useRemoveMember } from "../../hooks/useTeam";
import { useMe } from "../../hooks/useMe";
import type { TeamMember, InviteMemberInput } from "../../services/team.service";

const ROLE_LABEL: Record<string, string> = { OWNER: "Dono", ADMIN: "Administrador", MEMBER: "Membro" };
const ROLE_CLS: Record<string, string> = {
  OWNER: "text-brand-primary bg-sky-500/10 border-sky-500/20",
  ADMIN: "text-brand-success bg-emerald-500/10 border-emerald-500/20",
  MEMBER: "text-text-muted bg-bg-elevated border-border-subtle",
};

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

const EMPTY: InviteMemberInput = { name: "", email: "", password: "", role: "MEMBER" };

export const TeamPage: React.FC = () => {
  const { data: me } = useMe();
  const { data: members = [], isLoading, error } = useTeam();
  const invite = useInviteMember();
  const changeRole = useChangeRole();
  const removeMember = useRemoveMember();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InviteMemberInput>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);

  const isOwner = me?.role === "OWNER";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.name.trim().length < 2) return setFormError("Informe o nome.");
    if (form.password.length < 8) return setFormError("A senha deve ter no mínimo 8 caracteres.");
    try {
      await invite.mutateAsync(form);
      setOpen(false);
      setForm(EMPTY);
    } catch (err) {
      setFormError(apiError(err, "Não foi possível convidar."));
    }
  };

  const input =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  return (
    <div className="animate-fade-in mt-12 space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
            <UsersRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
            <p className="text-text-muted text-sm">Convide pessoas e defina o nível de acesso.</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setFormError(null); setOpen(true); }}
          className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Convidar
        </button>
      </div>

      {/* Explicação dos papéis */}
      <div className="bg-bg-card border border-border-subtle/60 rounded-2xl p-5 text-sm text-text-muted flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-brand-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p><strong className="text-text-main">Dono</strong> — controle total, inclusive da equipe e do plano.</p>
          <p><strong className="text-text-main">Administrador</strong> — gerencia equipe e configurações; opera tudo.</p>
          <p><strong className="text-text-main">Membro</strong> — opera clientes e cobranças; não gerencia a equipe.</p>
        </div>
      </div>

      {error ? (
        <div className="text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-sm">
          Não foi possível carregar a equipe.
        </div>
      ) : (
        <div className="bg-bg-card border border-border-subtle/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-text-muted uppercase tracking-wider bg-bg-card/80">
                <tr>
                  <th className="p-4 font-semibold">Nome</th>
                  <th className="p-4 font-semibold">E-mail</th>
                  <th className="p-4 font-semibold">Papel</th>
                  <th className="p-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-text-muted"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                ) : (
                  members.map((m) => {
                    const isSelf = me?.id === m.id;
                    const canManage = !isSelf && (m.role !== "OWNER" || isOwner);
                    return (
                      <tr key={m.id}>
                        <td className="p-4 font-medium">{m.name}{isSelf && <span className="text-xs text-text-faint"> (você)</span>}</td>
                        <td className="p-4 text-text-muted">{m.email}</td>
                        <td className="p-4">
                          {m.role === "OWNER" || !canManage ? (
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_CLS[m.role] ?? ROLE_CLS.MEMBER}`}>
                              {ROLE_LABEL[m.role] ?? m.role}
                            </span>
                          ) : (
                            <select
                              value={m.role}
                              onChange={(e) => changeRole.mutate({ id: m.id, role: e.target.value as "ADMIN" | "MEMBER" })}
                              className="focus-ring bg-bg-main/60 border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs"
                            >
                              <option value="ADMIN">Administrador</option>
                              <option value="MEMBER">Membro</option>
                            </select>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            {canManage && (
                              <button
                                onClick={() => setToRemove(m)}
                                className="focus-ring p-2 rounded-lg text-text-muted hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                                aria-label="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal convidar */}
      <Modal open={open} onClose={() => setOpen(false)} title="Convidar para a equipe">
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Nome</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">E-mail</span>
            <input className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Senha inicial</span>
            <input className={input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="mínimo 8 caracteres" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Papel</span>
            <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "MEMBER" })}>
              <option value="MEMBER">Membro</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>

          {formError && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-xl border border-border-subtle px-4 py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={invite.isPending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-semibold px-4 py-2 text-sm disabled:opacity-60">
              {invite.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Convidar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal remover */}
      <Modal open={!!toRemove} onClose={() => setToRemove(null)} title="Remover da equipe">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Remover <strong>{toRemove?.name}</strong>? A pessoa perde o acesso imediatamente.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setToRemove(null)} className="focus-ring rounded-xl border border-border-subtle px-4 py-2 text-sm">Cancelar</button>
            <button
              onClick={async () => { if (toRemove) { await removeMember.mutateAsync(toRemove.id).catch(() => {}); setToRemove(null); } }}
              disabled={removeMember.isPending}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-danger text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
            >
              {removeMember.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Remover
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
