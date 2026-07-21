import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useConsoleAuth } from "../../auth/ConsoleAuthContext";
import { LogoWordmark } from "../../components/Logo";

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

/** Login do CONSOLE da plataforma (spec 0031) — separado do login do cliente. */
export const ConsoleLoginPage: React.FC = () => {
  const { login } = useConsoleAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/console", { replace: true });
    } catch (err) {
      setError(apiError(err, "Não foi possível entrar."));
    } finally {
      setLoading(false);
    }
  };

  const input =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm";

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <LogoWordmark size={30} />
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-full px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Console da plataforma
          </span>
        </div>

        <form onSubmit={submit} className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6 space-y-4">
          <h1 className="text-lg font-bold">Acesso do administrador</h1>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">E-mail</span>
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Senha</span>
            <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>

          {error && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar no console
          </button>
        </form>
        <p className="text-center text-xs text-text-faint mt-4">Acesso restrito à equipe da plataforma.</p>
      </div>
    </div>
  );
};
