import { Component } from "react";
import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Captura erros de renderização e mostra um fallback amigável (sem tela branca). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Ponto para plugar observabilidade (Sentry etc.) no futuro.
    console.error("💥 ErrorBoundary capturou:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-main p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-danger/10 border border-brand-danger/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-brand-danger" />
            </div>
            <h1 className="text-xl font-bold">Algo deu errado</h1>
            <p className="text-text-muted text-sm mt-2">
              Ocorreu um erro inesperado. Recarregue a página para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="focus-ring mt-6 bg-brand-primary hover:bg-brand-hover text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
