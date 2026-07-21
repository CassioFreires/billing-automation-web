import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { consoleTokenStorage } from "../lib/token";
import { consoleAuthService } from "../services/console-auth.service";
import type { ConsoleLoginPayload } from "../services/console-auth.service";

interface ConsoleAuthValue {
  isAuthenticated: boolean;
  login: (payload: ConsoleLoginPayload) => Promise<void>;
  logout: () => void;
}

const ConsoleAuthContext = createContext<ConsoleAuthValue | undefined>(undefined);

/** Sessão do console (super-admin), independente da sessão do tenant. */
export function ConsoleAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    consoleAuthService.isAuthenticated()
  );

  const login = useCallback(async (payload: ConsoleLoginPayload) => {
    await consoleAuthService.login(payload);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    consoleAuthService.logout();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      consoleTokenStorage.clear();
      setIsAuthenticated(false);
    };
    window.addEventListener("console:unauthorized", onUnauthorized);
    return () => window.removeEventListener("console:unauthorized", onUnauthorized);
  }, []);

  return (
    <ConsoleAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </ConsoleAuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConsoleAuth(): ConsoleAuthValue {
  const ctx = useContext(ConsoleAuthContext);
  if (!ctx) throw new Error("useConsoleAuth deve ser usado dentro de <ConsoleAuthProvider>");
  return ctx;
}
