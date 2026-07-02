import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";

/**
 * Layout autenticado: sidebar fixa + área de conteúdo (Outlet das rotas filhas).
 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 lg:pl-64 pt-24 lg:pt-0 p-6 sm:p-10 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
