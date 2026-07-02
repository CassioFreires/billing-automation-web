import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/Layouts/AppShell";
import { LandingPage } from "./pages/Landing/LandingPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { RegisterPage } from "./pages/Register/RegisterPage";
import { DashboardPage } from "./pages/Dashboard/Dashboard";
import { ClientsPage } from "./pages/Clients/ClientsPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protegidas (exigem JWT) dentro do layout autenticado */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
