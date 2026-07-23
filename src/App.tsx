import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/Layouts/AppShell";
import { RouteFallback } from "./components/RouteFallback";
import { ConsoleAuthProvider } from "./auth/ConsoleAuthContext";
import { ConsoleRoute } from "./auth/ConsoleRoute";
import { ConsoleLayout } from "./pages/Console/ConsoleLayout";
import { PrivacyBanner } from "./components/PrivacyBanner";

// Code splitting: cada página vira um chunk carregado sob demanda.
// A landing pública não baixa o JS do painel, e vice-versa.
const LandingPage = lazy(() => import("./pages/Landing/LandingPage").then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/Login/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/Register/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("./pages/Dashboard/Dashboard").then((m) => ({ default: m.DashboardPage })));
const ClientsPage = lazy(() => import("./pages/Clients/ClientsPage").then((m) => ({ default: m.ClientsPage })));
const InvoicesPage = lazy(() => import("./pages/Invoices/InvoicesPage").then((m) => ({ default: m.InvoicesPage })));
const SubscriptionsPage = lazy(() => import("./pages/Subscriptions/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage })));
const RecoveryPage = lazy(() => import("./pages/Recovery/RecoveryPage").then((m) => ({ default: m.RecoveryPage })));
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const TeamPage = lazy(() => import("./pages/Team/TeamPage").then((m) => ({ default: m.TeamPage })));
const PlanPage = lazy(() => import("./pages/Plan/PlanPage").then((m) => ({ default: m.PlanPage })));
// Página PÚBLICA do devedor (spec 0018 — M2): acordo/pagamento, sem login.
const PayPage = lazy(() => import("./pages/Pay/PayPage").then((m) => ({ default: m.PayPage })));
// Páginas legais públicas (spec 0022 — LGPD).
const PrivacyPolicyPage = lazy(() => import("./pages/Legal/PrivacyPolicyPage").then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import("./pages/Legal/TermsPage").then((m) => ({ default: m.TermsPage })));
// Portal do pagador (spec 0027): público, todas as cobranças do cliente.
const PortalPage = lazy(() => import("./pages/Portal/PortalPage").then((m) => ({ default: m.PortalPage })));
// Console da PLATAFORMA (spec 0031): super-admin, isolado do app do cliente.
const ConsoleLoginPage = lazy(() => import("./pages/Console/ConsoleLoginPage").then((m) => ({ default: m.ConsoleLoginPage })));
const ConsoleDashboard = lazy(() => import("./pages/Admin/AdminPage").then((m) => ({ default: m.AdminPage })));

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Páginas legais públicas (spec 0022 — LGPD) */}
        <Route path="/privacidade" element={<PrivacyPolicyPage />} />
        <Route path="/termos" element={<TermsPage />} />
        {/* Página do devedor: abre o link /r/:token → redireciona pra cá (spec 0018 — M2) */}
        <Route path="/pagar/:token" element={<PayPage />} />
        {/* Portal do pagador: todas as cobranças do cliente (spec 0027) */}
        <Route path="/portal/:token" element={<PortalPage />} />

        {/* Console da plataforma (spec 0031): sessão/identidade próprias, fora do app do cliente */}
        <Route path="/console" element={<ConsoleAuthProvider><Outlet /></ConsoleAuthProvider>}>
          <Route path="login" element={<ConsoleLoginPage />} />
          <Route element={<ConsoleRoute />}>
            <Route element={<ConsoleLayout />}>
              <Route index element={<ConsoleDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* App do cliente (exige JWT de tenant) dentro do layout autenticado */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/recuperacoes" element={<RecoveryPage />} />
            <Route path="/plano" element={<PlanPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/equipe" element={<TeamPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Aviso de privacidade (LGPD, spec 0022) — global, dispensável */}
      <PrivacyBanner />
    </Suspense>
  );
}
