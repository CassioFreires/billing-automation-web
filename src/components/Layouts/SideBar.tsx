import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Receipt, Repeat, Settings, Gem, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { LogoWordmark } from "../Logo";

// App do cliente (tenant). O console do super-admin é uma área SEPARADA (/console)
// — não aparece aqui (spec 0031).
const menuItems = [
  { to: "/dashboard", label: "Painel Geral", icon: LayoutDashboard },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/invoices", label: "Faturas", icon: Receipt },
  { to: "/subscriptions", label: "Assinaturas", icon: Repeat },
  { to: "/plano", label: "Plano", icon: Gem },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const items = menuItems;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
      isActive
        ? "bg-brand-primary text-white shadow-md shadow-sky-500/10"
        : "text-text-muted hover:bg-bg-elevated/50 hover:text-white"
    }`;

  return (
    <>
      {/* Navbar Mobile */}
      <div className="lg:hidden bg-bg-card h-16 w-full flex items-center justify-between px-4 border-b border-border-subtle fixed top-0 left-0 z-50">
        <LogoWordmark size={24} />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="focus-ring text-white"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 lg:top-0 bottom-0 left-0 z-40 w-64 bg-bg-card border-r border-border-subtle/80 p-5 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between`}
      >
        <div>
          <div className="hidden lg:flex mb-10 pt-2">
            <LogoWordmark size={30} />
          </div>

          <nav className="space-y-1.5">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsOpen(false)}
                className={linkClass}
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Usuário + logout */}
        <div className="border-t border-border-subtle pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-primary/20 flex items-center justify-center font-bold text-brand-primary border border-brand-primary/30">
              CF
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">Minha Conta</p>
              <p className="text-xs text-text-muted truncate">admin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="focus-ring w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-muted hover:bg-brand-danger/10 hover:text-rose-300 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};
