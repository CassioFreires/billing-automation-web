import { Outlet, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import { LogoWordmark } from "../../components/Logo";
import { useConsoleAuth } from "../../auth/ConsoleAuthContext";

/**
 * Shell do CONSOLE da plataforma (spec 0031). Layout PRÓPRIO — sem a Sidebar do
 * app do cliente. Sinaliza claramente que é a área do super-admin.
 */
export function ConsoleLayout() {
  const { logout } = useConsoleAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/console/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      <header className="border-b border-border-subtle/80 bg-bg-card">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoWordmark size={24} />
            <span className="flex items-center gap-1.5 text-xs font-medium text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-full px-2.5 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Console
            </span>
          </div>
          <button
            onClick={onLogout}
            className="focus-ring flex items-center gap-2 text-sm text-text-muted hover:text-white px-3 py-1.5 rounded-lg hover:bg-bg-elevated/50 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
