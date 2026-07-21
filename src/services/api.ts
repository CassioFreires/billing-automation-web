import axios from "axios";
import { tokenStorage } from "../lib/token";

/**
 * Cliente HTTP único da aplicação.
 * - baseURL relativa (`/api`): em DEV o proxy do Vite encaminha para a API;
 *   em produção o nginx serve `/api` no mesmo host. Sem CORS, sem host fixo.
 * - Interceptor de request: injeta o JWT (Bearer) automaticamente.
 * - Interceptor de response: em 401, limpa o token e avisa a app (logout).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      tokenStorage.clear();
      // AuthContext escuta este evento para redirecionar ao login sem reload.
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    // Plano expirado/quota (spec 0020): 402 → paywall. AppShell escuta e leva ao /plano.
    if (status === 402) {
      window.dispatchEvent(
        new CustomEvent("billing:payment-required", { detail: error?.response?.data })
      );
    }
    return Promise.reject(error);
  }
);

export default api;
