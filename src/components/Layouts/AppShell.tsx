import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Clock, AlertCircle, Eye, Rocket } from "lucide-react";
import { Sidebar } from "./SideBar";
import { usePlan } from "../../hooks/useBilling";
import { useOnboarding } from "../../hooks/useOnboarding";
import { impersonation } from "../../lib/token";

/** Banner de impersonação (spec 0023): admin vendo como um tenant. */
function ImpersonationBanner() {
  const name = impersonation.current();
  if (!name) return null;
  const exit = () => {
    impersonation.stop();
    window.location.href = "/console";
  };
  return (
    <div className="flex items-center justify-center gap-2 text-sm bg-brand-primary/15 text-brand-primary border-b border-brand-primary/30 px-4 py-2">
      <Eye className="h-4 w-4" />
      Você está vendo como <strong>{name}</strong> (suporte).
      <button onClick={exit} className="focus-ring underline hover:text-brand-hover ml-1">
        Sair
      </button>
    </div>
  );
}

/**
 * Banner slim de onboarding (spec 0021): mostra o progresso em qualquer tela
 * enquanto a ativação não termina. No /dashboard some — lá o checklist completo
 * já aparece. Some também ao concluir/dispensar e durante impersonação.
 */
function OnboardingBanner() {
  const { data } = useOnboarding();
  const location = useLocation();
  if (impersonation.current() || !data) return null;
  if (data.completed || data.dismissed) return null;
  if (location.pathname === "/dashboard") return null;

  return (
    <Link
      to="/dashboard"
      className="flex items-center justify-center gap-2 text-sm bg-brand-primary/10 text-brand-primary border-b border-brand-primary/20 px-4 py-2 hover:bg-brand-primary/15 transition-colors"
    >
      <Rocket className="h-4 w-4" />
      Configuração inicial: {data.progress.done} de {data.progress.total} passos.{" "}
      <span className="underline">Continuar</span>
    </Link>
  );
}

/** Banner de trial/inadimplência acima do conteúdo (spec 0020). */
function PlanBanner() {
  const { data } = usePlan();
  const location = useLocation();
  // Não mostra durante impersonação (o banner de impersonação tem prioridade).
  if (impersonation.current() || !data || location.pathname === "/plano") return null;

  const daysLeft = data.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  if (data.status === "trialing" && daysLeft !== null) {
    return (
      <Link
        to="/plano"
        className="flex items-center justify-center gap-2 text-sm bg-amber-500/10 text-brand-warning border-b border-amber-500/20 px-4 py-2 hover:bg-amber-500/15 transition-colors"
      >
        <Clock className="h-4 w-4" />
        Teste grátis: {daysLeft} dia(s) restantes. <span className="underline">Escolher um plano</span>
      </Link>
    );
  }

  if (!data.entitlements.canWrite) {
    return (
      <Link
        to="/plano"
        className="flex items-center justify-center gap-2 text-sm bg-brand-danger/10 text-rose-300 border-b border-brand-danger/20 px-4 py-2 hover:bg-brand-danger/15 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        Seu plano expirou — as ações estão bloqueadas. <span className="underline">Regularizar</span>
      </Link>
    );
  }
  return null;
}

/**
 * Layout autenticado: sidebar fixa + área de conteúdo (Outlet das rotas filhas).
 * Escuta o evento de "pagamento requerido" (402) do interceptor e leva ao /plano.
 */
export function AppShell() {
  const navigate = useNavigate();

  useEffect(() => {
    const onPaymentRequired = () => navigate("/plano");
    window.addEventListener("billing:payment-required", onPaymentRequired);
    return () => window.removeEventListener("billing:payment-required", onPaymentRequired);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 lg:pl-64 flex flex-col">
        <ImpersonationBanner />
        <PlanBanner />
        <OnboardingBanner />
        <main className="pt-24 lg:pt-0 p-6 sm:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
