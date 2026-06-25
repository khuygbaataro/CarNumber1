// Simple client-side token storage for the admin panel.
// The backend enforces auth on every request; this is just for UX.

const TOKEN_KEY = 'dealership_token';

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
};
