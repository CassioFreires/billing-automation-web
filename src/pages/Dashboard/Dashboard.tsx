import React from 'react';
import { MessageSquare, AlertTriangle, CheckCircle, TrendingUp, Send } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in mt-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Painel de Automações</h1>
        <p className="text-text-muted text-sm mt-1">Acompanhe a saúde financeira e os disparos do seu WhatsApp em tempo real.</p>
      </div>

      {/* Grid de Cards Métricos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-bg-card p-6 rounded-2xl border border-slate-800/60 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Inadimplência Evitada</p><p className="text-2xl font-black text-brand-success mt-1">R$ 4.850,00</p></div>
          <div className="p-3 bg-brand-success/10 rounded-xl text-brand-success"><TrendingUp className="h-6 w-6" /></div>
        </div>
        <div className="bg-bg-card p-6 rounded-2xl border border-slate-800/60 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total em Atraso</p><p className="text-2xl font-black text-brand-warning mt-1">R$ 1.240,00</p></div>
          <div className="p-3 bg-brand-warning/10 rounded-xl text-brand-warning"><AlertTriangle className="h-6 w-6" /></div>
        </div>
        <div className="bg-bg-card p-6 rounded-2xl border border-slate-800/60 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Disparos Concluídos</p><p className="text-2xl font-black text-white mt-1">342</p></div>
          <div className="p-3 bg-slate-800 rounded-xl text-brand-primary"><MessageSquare className="h-6 w-6" /></div>
        </div>
        <div className="bg-bg-card p-6 rounded-2xl border border-slate-800/60 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Taxa de Resposta</p><p className="text-2xl font-black text-white mt-1">74.2%</p></div>
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary"><CheckCircle className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Monitor de Atividade Recente (Logs Mockados Seguros) */}
      <div className="bg-bg-card border border-slate-800/60 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Send className="h-4 w-4 text-brand-primary" /> Atividade da Régua Automática</h3>
        <div className="space-y-4 font-mono text-xs text-slate-300">
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
            <span>[11:24:02] 🟢 Lembrete amigável enviado para <strong>Rodrigo Silva</strong> (Vence em 3 dias)</span>
            <span className="text-brand-success font-bold">SUCESSO</span>
          </div>
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
            <span>[09:00:15] 🔴 Alerta de atraso severo disparado para <strong>Mariana Costa</strong> (Inadimplente há 5 dias)</span>
            <span className="text-brand-success font-bold">SUCESSO</span>
          </div>
        </div>
      </div>
    </div>
  );
};