import React, { useState } from 'react';
import { LayoutDashboard, Users, Settings, Menu, X, Bot } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'clients', label: 'Gerenciar Clientes', icon: <Users className="h-5 w-5" /> },
    { id: 'settings', label: 'Configurações API', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Navbar Mobile */}
      <div className="lg:hidden bg-bg-card h-16 w-full flex items-center justify-between px-4 border-b border-slate-800 fixed top-0 left-0 z-50">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-brand-primary" />
          <span className="font-bold text-md tracking-wider">AUTO<span className="text-brand-primary">CORE</span></span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`fixed top-16 lg:top-0 bottom-0 left-0 z-40 w-64 bg-bg-card border-r border-slate-800/80 p-5 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between`}>
        <div>
          {/* Logo Desktop */}
          <div className="hidden lg:flex items-center gap-2 mb-10 pt-2">
            <Bot className="h-7 w-7 text-brand-primary animate-pulse" />
            <span className="font-bold text-xl tracking-wider">AUTO<span className="text-brand-primary">CORE</span></span>
          </div>

          {/* Itens do Menu */}
          <nav className="space-y-1.5">
            {menuItems.map((item:any) => (
              <button
                key={item.id}
                onClick={() => { setActivePage(item.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activePage === item.id 
                    ? 'bg-brand-primary text-white shadow-md shadow-sky-500/10' 
                    : 'text-text-muted hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                {item.style && <span className={item.style}>{item.icon}</span>}
                {!item.style && item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Info do Usuário Logado (Dono do Estabelecimento) */}
        <div className="border-t border-slate-800 pt-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-primary/20 flex items-center justify-center font-bold text-brand-primary border border-brand-primary/30">
            CF
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">Clinica OdontoFit</p>
            <p className="text-xs text-text-muted truncate">admin@odontofit.com</p>
          </div>
        </div>
      </aside>
    </>
  );
};