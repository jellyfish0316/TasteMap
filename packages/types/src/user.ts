// Mirrors backend app/schemas/auth.py

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
