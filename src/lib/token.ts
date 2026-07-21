/**
 * Armazenamento de tokens. Centralizado para trocar de estratégia (localStorage,
 * cookie httpOnly, etc.) num único lugar. Ver SDD/context/architecture.md.
 *
 * Duas SESSÕES independentes (spec 0031):
 *  - tenant  → `adimplo.token`         (app do cliente)
 *  - console → `adimplo.console_token` (super-admin da plataforma)
 * Chaves distintas garantem que console e tenant não colidem (podem coexistir).
 */
const TOKEN_KEY = "adimplo.token";
const CONSOLE_TOKEN_KEY = "adimplo.console_token";
const IMPERSONATING_KEY = "adimplo.impersonating"; // nome do tenant impersonado

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};

/** Sessão do console da plataforma (super-admin), separada do tenant. */
export const consoleTokenStorage = {
  get(): string | null {
    return localStorage.getItem(CONSOLE_TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(CONSOLE_TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(CONSOLE_TOKEN_KEY);
  },
};

/**
 * Impersonação (spec 0031): o admin (logado no console) entra num tenant. Só
 * ativa o token de tenant + uma flag; a sessão do console (console_token)
 * permanece intacta, então "Sair" volta ao console sem novo login.
 */
export const impersonation = {
  start(tenantToken: string, tenantName: string): void {
    localStorage.setItem(TOKEN_KEY, tenantToken);
    localStorage.setItem(IMPERSONATING_KEY, tenantName);
  },
  stop(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(IMPERSONATING_KEY);
  },
  current(): string | null {
    return localStorage.getItem(IMPERSONATING_KEY);
  },
};
