import axios from "axios";
import { consoleTokenStorage } from "../lib/token";

/**
 * Cliente HTTP do CONSOLE da plataforma (spec 0031). Instância SEPARADA do
 * `api` do tenant: injeta o token do console (`adimplo.console_token`), nunca o
 * do tenant. Assim as duas sessões são totalmente independentes.
 */
const consoleApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

consoleApi.interceptors.request.use((config) => {
  const token = consoleTokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

consoleApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      consoleTokenStorage.clear();
      window.dispatchEvent(new Event("console:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default consoleApi;
