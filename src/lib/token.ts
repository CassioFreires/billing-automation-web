/**
 * Armazenamento do JWT. Centralizado para trocar de estratégia (localStorage,
 * cookie httpOnly, etc.) num único lugar. Ver SDD/context/architecture.md.
 */
const TOKEN_KEY = "adimplo.token";
const ADMIN_BACKUP_KEY = "adimplo.admin_token"; // token do admin durante impersonação
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

/** Suporte à impersonação do super-admin (spec 0023). */
export const impersonation = {
  /** Guarda o token do admin e ativa o token de impersonação. */
  start(impersonationToken: string, tenantName: string): void {
    const admin = localStorage.getItem(TOKEN_KEY);
    if (admin) localStorage.setItem(ADMIN_BACKUP_KEY, admin);
    localStorage.setItem(TOKEN_KEY, impersonationToken);
    localStorage.setItem(IMPERSONATING_KEY, tenantName);
  },
  /** Restaura o token do admin e sai da impersonação. */
  stop(): void {
    const admin = localStorage.getItem(ADMIN_BACKUP_KEY);
    if (admin) localStorage.setItem(TOKEN_KEY, admin);
    localStorage.removeItem(ADMIN_BACKUP_KEY);
    localStorage.removeItem(IMPERSONATING_KEY);
  },
  /** Nome do tenant impersonado, ou null se não está impersonando. */
  current(): string | null {
    return localStorage.getItem(IMPERSONATING_KEY);
  },
};
