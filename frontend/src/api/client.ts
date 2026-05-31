// Web wiring for the shared @tastemap/api-client. This configures the
// platform-agnostic client with the web's token storage (localStorage) and 401
// behavior (bounce to /login). Imported once at startup from main.tsx.
import { configureApi, client } from "@tastemap/api-client";

export const TOKEN_KEY = "tastemap_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

configureApi({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  getToken,
  onUnauthorized: () => {
    setToken(null);
    if (window.location.pathname !== "/login") window.location.assign("/login");
  },
});

// The configured axios instance (back-compat for any direct importers).
export const api = client();

// Re-export the shared error formatter so existing `@/api/client` imports work.
export { errorMessage } from "@tastemap/api-client";
