import React, { useState } from 'react';
import { Plus, Search, Send, UserCheck, UserX } from 'lucide-react';
import { useClients } from '../../hooks/useClient';

export const ClientsPage: React.FC = () => {
  const {clients, loading, error} = useClients();

  const handleManualTrigger = async (phone: string, name: string) => {
    try {
      await fetch('http://localhost:3333/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, clientName: name })
      });
      alert(`Fluxo manual enviado para o WhatsApp de ${name}!`);
    } catch {
      alert("Erro ao conectar com o servidor da automação.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in mt-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Carteira de Clientes</h1>
          <p className="text-text-muted text-sm mt-1">Monitore quem está pendente e acione gatilhos de cobrança manuais se necessário.</p>
        </div>
        <button className="bg-brand-primary hover:bg-sky-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-sky-500/10">
          <Plus className="h-4 w-4" /> Cadastrar Cliente
        </button>
      </div>

      {/* Filtros de Busca */}
      <div className="bg-bg-card border border-slate-800/60 p-4 rounded-xl flex items-center gap-3">
        <Search className="h-5 w-5 text-text-muted" />
        <input type="text" placeholder="Filtrar por nome, CPF ou telefone..." className="bg-transparent text-sm w-full focus:outline-none text-white placeholder-slate-500" />
      </div>

      {/* Tabela Responsiva Premium */}
      <div className="bg-bg-card border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-text-muted text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Cliente</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4">Situação</th>
                <th className="p-4">Pendente</th>
                <th className="p-4 text-center">Régua Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="p-4 font-semibold">
                    <div>{client.name}</div>
                    <div className="text-xs text-text-muted font-normal mt-0.5">{client.doc}</div>
                  </td>
                  <td className="p-4 text-slate-300 font-mono">{client.phone}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${
                      client.status === 'EM_ATRASO' ? 'bg-brand-warning/10 text-brand-warning' : 'bg-brand-success/10 text-brand-success'
                    }`}>
                      {client.status === 'EM_ATRASO' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      {client.status === 'EM_ATRASO' ? 'Inadimplente' : 'Em Dia'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">R$ {client.debtValue.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleManualTrigger(client.phone, client.name)}
                      className="p-2 bg-slate-800 hover:bg-brand-primary text-text-muted hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Forçar Envio de Mensagem"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};