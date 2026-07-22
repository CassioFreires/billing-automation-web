import api from "./api";
import { tokenStorage } from "../lib/token";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  accountName: string;
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean; // LGPD (spec 0022): aceite dos Termos/Política
}

export interface AuthResponse {
  token: string;
  expiresIn: string;
}

/**
 * Serviço de autenticação. O backend expõe POST /api/auth/login e retorna
 * { token, expiresIn }. O token é persistido pelo tokenStorage e injetado
 * em toda request pelo interceptor do api.ts.
 */
export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    tokenStorage.set(data.token);
    return data;
  },

  /** Cria conta (tenant) + usuário dono e já autentica (backend devolve o token). */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    tokenStorage.set(data.token);
    return data;
  },

  logout(): void {
    tokenStorage.clear();
  },

  isAuthenticated(): boolean {
    return Boolean(tokenStorage.get());
  },
};
