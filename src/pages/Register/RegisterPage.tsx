import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, User, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { isAxiosError } from "axios";
import { Logo } from "../../components/Logo";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [accountName, setAccountName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await register({ accountName, name, email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError("Este e-mail já está cadastrado.");
      } else if (isAxiosError(err) && err.response?.data?.error) {
        setError(String(err.response.data.error));
      } else if (isAxiosError(err) && !err.response) {
        setError("Não foi possível conectar ao servidor. Verifique a API.");
      } else {
        setError("Erro ao criar a conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-sm placeholder-text-faint";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4">
            <Logo size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Adim<span className="text-brand-primary">plo</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Crie sua conta grátis</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-card/80 backdrop-blur-sm border border-border-subtle/80 rounded-2xl p-7 shadow-2xl space-y-4"
        >
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Criar conta</h2>
            <p className="text-text-muted text-sm">Sua conta (empresa) e o usuário dono.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Nome da empresa</span>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
              <input type="text" required minLength={2} value={accountName}
                onChange={(e) => setAccountName(e.target.value)} placeholder="Minha Empresa" className={fieldClass} />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Seu nome</span>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
              <input type="text" required minLength={2} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={fieldClass} />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">E-mail</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
              <input type="email" required autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" className={fieldClass} />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Senha</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
              <input type="password" required minLength={8} autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 8 caracteres" className={fieldClass} />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sky-500/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <p className="text-center text-sm text-text-muted">
            Já tem conta?{" "}
            <Link to="/login" className="text-brand-primary hover:text-brand-hover font-medium">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
