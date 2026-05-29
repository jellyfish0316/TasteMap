import { create } from "zustand";

import { authApi } from "@/api/authApi";
import { errorMessage, getToken, setToken } from "@/api/client";
import type { LoginPayload, RegisterPayload, User } from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getToken(),
  loading: false,
  error: null,

  async login(payload) {
    set({ loading: true, error: null });
    try {
      const { access_token } = await authApi.login(payload);
      setToken(access_token);
      set({ token: access_token });
      const user = await authApi.me();
      set({ user, loading: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err, "Login failed") });
      throw err;
    }
  },

  async register(payload) {
    set({ loading: true, error: null });
    try {
      await authApi.register(payload);
      set({ loading: false });
      await get().login({ email: payload.email, password: payload.password });
    } catch (err) {
      set({ loading: false, error: errorMessage(err, "Registration failed") });
      throw err;
    }
  },

  // Restore the session on app load if a token is present.
  async loadMe() {
    if (!get().token) return;
    try {
      set({ user: await authApi.me() });
    } catch {
      setToken(null);
      set({ token: null, user: null });
    }
  },

  logout() {
    setToken(null);
    set({ user: null, token: null });
  },
}));
