import React, { useState } from 'react';
import { Sidebar } from './components/Layouts/SideBar';
import { DashboardPage } from './pages/Dashboard/Dashboard';
import { ClientsPage } from './components/ClientsPage/ClientsPage';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('dashboard');

  return (
    <div className="min-h-screen bg-bg-main text-white flex flex-col lg:flex-row">
      {/* Menu de Navegação Global */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      {/* Conteúdo Principal Dinâmico */}
      <main className="flex-1 lg:pl-64 pt-24 lg:pt-0 p-6 sm:p-10 max-w-7xl mx-auto w-full">
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'clients' && <ClientsPage />}
        {activePage === 'settings' && (
          <div className="p-6 bg-bg-card rounded-2xl border border-slate-800 animate-fade-in">
            <h2 className="text-2xl font-bold">Configuração da API (Evolution / n8n)</h2>
            <p className="text-text-muted text-sm mt-1">Conecte sua instância dedicada do WhatsApp.</p>
            <div className="mt-6 p-4 bg-slate-900 border border-slate-800 text-sm text-brand-primary rounded-xl font-mono">
              Status do Servidor: CONECTADO À INSTÂNCIA VPS_NODE_01
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;