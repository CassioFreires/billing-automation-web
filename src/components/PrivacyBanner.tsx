import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, X } from "lucide-react";

const ACK_KEY = "adimplo.privacy_ack";

/**
 * Aviso de privacidade/cookies (spec 0022, LGPD). Aparece uma vez até o usuário
 * confirmar; o "ok" é persistido em localStorage. Não é bloqueante — o app usa
 * armazenamento local só para funcionar (token/preferências).
 */
export const PrivacyBanner: React.FC = () => {
  const [ack, setAck] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ACK_KEY) === "1";
    } catch {
      return true; // se não há storage, não incomoda
    }
  });

  if (ack) return null;

  const accept = () => {
    try {
      localStorage.setItem(ACK_KEY, "1");
    } catch {
      /* ignora */
    }
    setAck(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl bg-bg-card border border-border-subtle rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm text-text-muted">
            Usamos armazenamento local apenas para o funcionamento da plataforma e tratamos dados
            conforme a{" "}
            <Link to="/privacidade" className="text-brand-primary hover:text-brand-hover font-medium">
              Política de Privacidade
            </Link>
            . Ao continuar, você concorda com os{" "}
            <Link to="/termos" className="text-brand-primary hover:text-brand-hover font-medium">
              Termos de Uso
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="focus-ring bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
          >
            Entendi
          </button>
          <button
            onClick={accept}
            aria-label="Fechar"
            className="focus-ring text-text-faint hover:text-text-main rounded-lg p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
