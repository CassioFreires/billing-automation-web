import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { isAxiosError } from "axios";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setError("Usuário ou senha inválidos.");
      } else if (isAxiosError(err) && !err.response) {
        setError("Não foi possível conectar ao servidor. Verifique a API.");
      } else {
        setError("Erro ao entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Marca */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4">
            <Bot className="h-7 w-7 text-brand-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            AUTO<span className="text-brand-primary">CORE</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Cobrança automática por WhatsApp</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-bg-card/80 backdrop-blur-sm border border-border-subtle/80 rounded-2xl p-7 shadow-2xl space-y-5"
        >
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Entrar</h2>
            <p className="text-text-muted text-sm">Acesse o painel da sua conta.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Usuário</span>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-sm placeholder-text-faint"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Senha</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-sm placeholder-text-faint"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sky-500/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-text-faint mt-6">
          © {new Date().getFullYear()} AUTOCORE · Painel de automação de cobrança
        </p>
      </div>
    </div>
  );
};
