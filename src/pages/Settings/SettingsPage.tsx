import React from "react";
import { Settings, Wifi } from "lucide-react";

export const SettingsPage: React.FC = () => {
  return (
    <div className="animate-fade-in mt-12 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-text-muted text-sm">Integração do WhatsApp e da automação.</p>
        </div>
      </div>

      <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
          <Wifi className="h-4 w-4" />
          Status da integração
        </div>
        <div className="mt-4 p-4 bg-bg-main border border-border-subtle text-sm text-text-muted rounded-xl font-mono">
          WhatsApp: modo <span className="text-brand-warning">log</span> (envio simulado) — conecte o número real para ativar.
        </div>
      </div>
    </div>
  );
};
