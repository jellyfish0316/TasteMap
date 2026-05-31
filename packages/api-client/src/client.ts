import axios, { type AxiosInstance } from "axios";

// The client is platform-agnostic: it knows nothing about localStorage,
// SecureStore, or how to navigate to /login. Each app injects those via
// configureApi() at startup (web: frontend/src/api/client.ts, mobile:
// apps/mobile/src/lib/api.ts).
export interface ApiConfig {
  // Base URL for the backend. Web uses "/api/v1" (Vite proxy); mobile uses an
  // absolute URL like "http://192.168.x.x:8000/api/v1".
  baseURL: string;
  // Return the current JWT (or null). May be async (mobile SecureStore is async),
  // but a sync cached value is preferred so the request interceptor stays simple.
  getToken?: () => string | null | Promise<string | null>;
  // Called when the backend returns 401 — the app decides whether to clear the
  // token and bounce to login.
  onUnauthorized?: () => void;
}

let instance: AxiosInstance | null = null;

export function configureApi(config: ApiConfig): AxiosInstance {
  const c = axios.create({ baseURL: config.baseURL });

  // Attach the bearer token (if any) to every request.
  c.interceptors.request.use(async (req) => {
    const token = config.getToken ? await config.getToken() : null;
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  // Let the app react to auth failures (clear token, redirect to login).
  c.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) config.onUnauthorized?.();
      return Promise.reject(error);
    },
  );

  instance = c;
  return c;
}

// The configured axios instance. Throws if used before configureApi() — that
// means the app forgot to call configureApi() at startup.
export function client(): AxiosInstance {
  if (!instance) {
    throw new Error(
      "@tastemap/api-client used before configureApi() was called. " +
        "Call configureApi({ baseURL, getToken, onUnauthorized }) at app startup.",
    );
  }
  return instance;
}

function validationDetailMessage(detail: unknown): string | null {
  if (!Array.isArray(detail)) return null;

  const messages = detail
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const maybeDetail = item as { loc?: unknown; msg?: unknown };
      if (typeof maybeDetail.msg !== "string") return null;

      const loc = Array.isArray(maybeDetail.loc)
        ? maybeDetail.loc.filter((part) => part !== "body").join(".")
        : null;
      return loc ? `${loc}: ${maybeDetail.msg}` : maybeDetail.msg;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length ? messages.join("\n") : null;
}

// Backend app errors are shaped { error: { code, message } }. FastAPI request
// validation errors are shaped { detail: [{ loc, msg, ... }] }.
export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    return (
      data?.error?.message ??
      validationDetailMessage(data?.detail) ??
      err.message ??
      fallback
    );
  }
  return fallback;
}
