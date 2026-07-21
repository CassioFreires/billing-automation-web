import { Navigate, Outlet } from "react-router-dom";
import { useAdminMe } from "../hooks/useAdmin";
import { RouteFallback } from "../components/RouteFallback";

/**
 * Guarda de rota do super-admin (spec 0023): só passa quem o backend reconhece
 * como admin (GET /admin/me = 200). Não-admin → volta ao painel.
 */
export function AdminRoute() {
  const { isLoading, isError } = useAdminMe();
  if (isLoading) return <RouteFallback />;
  if (isError) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
