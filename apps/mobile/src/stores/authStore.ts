import { authApi, errorMessage } from "@tastemap/api-client";
import type { User } from "@tastemap/types";
import { create } from "zustand";

import { clearToken, loadToken, setToken } from "@/lib/storage";

interface AuthState {
  user: User | null;
  token: string | null;
  // false until we've checked SecureStore for an existing session on launch.
  ready: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  ready: false,
  error: null,

  async bootstrap() {
    const token = await loadToken();
    set({ token });
    if (token) {
      try {
        await get().fetchMe();
      } catch {
        await clearToken();
        set({ token: null, user: null });
      }
    }
    set({ ready: true });
  },

  async login(email, password) {
    set({ error: null });
    try {
      const { access_token } = await authApi.login({ email, password });
      await setToken(access_token);
      set({ token: access_token });
      await get().fetchMe();
    } catch (err) {
      const message = errorMessage(err, "Login failed");
      set({ error: message });
      throw new Error(message);
    }
  },

  async register(email, username, password, displayName) {
    set({ error: null });
    try {
      await authApi.register({ email, username, password, display_name: displayName });
      await get().login(email, password);
    } catch (err) {
      const message = errorMessage(err, "Registration failed");
      set({ error: message });
      throw new Error(message);
    }
  },

  async logout() {
    await clearToken();
    set({ token: null, user: null });
  },

  async fetchMe() {
    set({ user: await authApi.me() });
  },
}));
