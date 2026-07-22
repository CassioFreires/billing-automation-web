import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LogoWordmark } from "../../components/Logo";

/** Versão dos textos legais — deve casar com LEGAL_VERSION do backend (spec 0022). */
export const LEGAL_VERSION = "2026-07-21";

/**
 * Casca das páginas legais (Política/Termos), spec 0022. Públicas, sem login.
 * Conteúdo é um MODELO inicial — precisa de revisão jurídica antes de produção real.
 */
export const LegalLayout: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      <header className="border-b border-border-subtle/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="focus-ring rounded-lg">
            <LogoWordmark size={26} />
          </Link>
          <Link
            to="/"
            className="focus-ring inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-full px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Documento legal
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-4">{title}</h1>
        <p className="text-text-muted mt-2">{subtitle}</p>
        <p className="text-xs text-text-faint mt-1">
          Versão {LEGAL_VERSION} · última atualização em 21/07/2026
        </p>

        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-brand-warning text-sm px-4 py-3">
          <strong>Aviso:</strong> este é um modelo inicial para o ambiente de demonstração.
          Antes do uso com dados reais, o texto deve ser revisado por um profissional jurídico.
        </div>

        <article className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
          {children}
        </article>

        <div className="mt-12 pt-6 border-t border-border-subtle/60 flex flex-wrap gap-4 text-sm">
          <Link to="/privacidade" className="text-brand-primary hover:text-brand-hover font-medium">
            Política de Privacidade
          </Link>
          <Link to="/termos" className="text-brand-primary hover:text-brand-hover font-medium">
            Termos de Uso
          </Link>
        </div>
      </main>
    </div>
  );
};

/** Título de seção padronizado dentro do texto legal. */
export const LegalSection: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({
  n,
  title,
  children,
}) => (
  <section className="space-y-2">
    <h2 className="text-lg font-bold text-text-main">
      <span className="text-brand-primary">{n}.</span> {title}
    </h2>
    {children}
  </section>
);
