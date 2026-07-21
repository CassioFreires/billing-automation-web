import consoleApi from "./consoleApi";
import { consoleTokenStorage } from "../lib/token";

/** Autenticação do console da plataforma (spec 0031) — separada do tenant. */
export interface ConsoleLoginPayload {
  email: string;
  password: string;
}

export interface ConsoleAdmin {
  email: string;
  name: string;
  role: string;
}

class ConsoleAuthService {
  async login(payload: ConsoleLoginPayload): Promise<ConsoleAdmin> {
    const { data } = await consoleApi.post("/admin/auth/login", payload);
    consoleTokenStorage.set(data.token);
    return data.admin;
  }

  logout(): void {
    consoleTokenStorage.clear();
  }

  isAuthenticated(): boolean {
    return Boolean(consoleTokenStorage.get());
  }
}

export const consoleAuthService = new ConsoleAuthService();
