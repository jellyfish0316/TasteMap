import type { AuthToken, LoginPayload, RegisterPayload, User } from "@tastemap/types";

import { client } from "./client";

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await client().post<User>("/auth/register", payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthToken> {
    const { data } = await client().post<AuthToken>("/auth/login", payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await client().get<User>("/auth/me");
    return data;
  },
};
