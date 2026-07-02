import React, { useState } from 'react';
import { Plus, Search, Send, Calendar, CheckCircle2, AlertCircle, Bot, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInvoiceOverdue } from '../../hooks/useInvoiceOverdue';
import notificationService from '../../services/notification.service';

export const ClientsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Passando os parâmetros de paginação para o hook buscar da API reformulada
  const {
    data,
    isLoading,
    error
  } = useInvoiceOverdue(currentPage, itemsPerPage);

  // Desestruturando o novo formato de resposta do backend
  const invoicesOverdue = data?.invoices || [];
  const meta = data?.meta || { totalPages: 1, totalItems: 0 };

  const handleManualTrigger = async (invoiceId: string, name: string) => {
    try {
      await notificationService.triggerByInvoice(invoiceId);
      alert(`Cobrança de ${name} enviada para a fila de processamento!`);
    } catch {
      alert('Erro ao enfileirar a cobrança. Verifique sua conexão/sessão.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return <div className="text-white p-6 animate-pulse">Carregando dados financeiros paginados...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">Erro ao carregar carteira de inadimplentes.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in mt-12 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestão de Inadimplência
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Exibindo faturas em atraso com paginação de alta performance.
          </p>
        </div>

        <button className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-sky-500/10 active:scale-95">
          <Plus className="h-4 w-4" />
          Cadastrar Cliente
        </button>
      </div>

      {/* Filtro */}
      <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3 backdrop-blur-sm">
        <Search className="h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Filtrar por nome, CPF ou telefone..."
          className="bg-transparent text-sm w-full focus:outline-none text-white placeholder-slate-500"
        />
      </div>

      {/* Tabela de Dados */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Cliente / Cadastro</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4">Status Automação</th>
                <th className="p-4">Régua de Envio</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Valor Fatura</th>
                <th className="p-4 text-center">Régua Manual</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50 text-sm">
              {invoicesOverdue.map((item: any) => {
                const clientName = item.client?.name || 'Cliente Sem Nome';
                const clientPhone = item.client?.phone || item.phone;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="font-semibold text-white group-hover:text-sky-400 transition-colors">{clientName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.client?.document || 'Sem documento'}</div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{clientPhone ? `+${clientPhone}` : '-'}</td>
                    <td className="p-4">
                      {item.client?.processed ? (
                        <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5" /> Processado
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Fila de Espera
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.notificationSent ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Notificado
                        </span>
                      ) : (
                        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Não Notificado
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>Venc: {formatDate(item.dueDate)}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-rose-400 font-mono">
                      R$ {Number(item.value || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleManualTrigger(item.id, clientName)}
                        className="p-2 bg-slate-800/80 hover:bg-sky-600 text-slate-400 hover:text-white rounded-xl border border-slate-700/50 transition-all cursor-pointer inline-flex items-center justify-center hover:shadow-lg hover:shadow-sky-500/20 active:scale-95"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {invoicesOverdue.length === 0 && (
            <div className="text-center p-8 text-slate-500 text-sm">Nenhuma fatura encontrada.</div>
          )}
        </div>

        {/* COMPONENTE DE PAGINAÇÃO DA UI/UX */}
        <div className="bg-slate-900/60 border-t border-slate-800 px-4 py-4 flex items-center justify-between flex-col sm:flex-row gap-4">
          <div className="text-xs text-slate-400">
            Mostrando página <span className="font-semibold text-white">{meta.currentPage}</span> de{' '}
            <span className="font-semibold text-white">{meta.totalPages}</span> ({meta.totalItems} faturas no total)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-xs font-semibold px-3 py-1.5 bg-slate-800/50 border border-slate-800 rounded-lg text-sky-400">
              {currentPage}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, meta.totalPages))}
              disabled={currentPage === meta.totalPages}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};