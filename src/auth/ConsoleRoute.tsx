import { Navigate, Outlet } from "react-router-dom";
import { useConsoleAuth } from "./ConsoleAuthContext";

/** Guarda do console (spec 0031): sem sessão de console → tela de login própria. */
export function ConsoleRoute() {
  const { isAuthenticated } = useConsoleAuth();
  if (!isAuthenticated) return <Navigate to="/console/login" replace />;
  return <Outlet />;
}
