import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/Layouts/AppShell";
import { RouteFallback } from "./components/RouteFallback";

// Code splitting: cada página vira um chunk carregado sob demanda.
// A landing pública não baixa o JS do painel, e vice-versa.
const LandingPage = lazy(() => import("./pages/Landing/LandingPage").then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/Login/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/Register/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("./pages/Dashboard/Dashboard").then((m) => ({ default: m.DashboardPage })));
const ClientsPage = lazy(() => import("./pages/Clients/ClientsPage").then((m) => ({ default: m.ClientsPage })));
const InvoicesPage = lazy(() => import("./pages/Invoices/InvoicesPage").then((m) => ({ default: m.InvoicesPage })));
const SubscriptionsPage = lazy(() => import("./pages/Subscriptions/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage })));
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const PlanPage = lazy(() => import("./pages/Plan/PlanPage").then((m) => ({ default: m.PlanPage })));
// Página PÚBLICA do devedor (spec 0018 — M2): acordo/pagamento, sem login.
const PayPage = lazy(() => import("./pages/Pay/PayPage").then((m) => ({ default: m.PayPage })));

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Página do devedor: abre o link /r/:token → redireciona pra cá (spec 0018 — M2) */}
        <Route path="/pagar/:token" element={<PayPage />} />

        {/* Protegidas (exigem JWT) dentro do layout autenticado */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/plano" element={<PlanPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
