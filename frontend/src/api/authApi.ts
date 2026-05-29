import type { AuthToken, LoginPayload, RegisterPayload, User } from "@/types/user";

import { api } from "./client";

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await api.post<User>("/auth/register", payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthToken> {
    const { data } = await api.post<AuthToken>("/auth/login", payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
