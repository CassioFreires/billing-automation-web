/**
 * Armazenamento do JWT. Centralizado para trocar de estratégia (localStorage,
 * cookie httpOnly, etc.) num único lugar. Ver SDD/context/architecture.md.
 */
const TOKEN_KEY = "autocore.token";

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
