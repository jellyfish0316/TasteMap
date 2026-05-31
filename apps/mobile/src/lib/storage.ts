// Mobile token storage — the SecureStore counterpart to the web's localStorage.
// We keep an in-memory cache so the api-client's getToken() can stay synchronous
// (SecureStore itself is async); the cache is hydrated at startup by loadToken().
import * as SecureStore from "expo-secure-store";

const KEY = "tastemap_token";
let cached: string | null = null;

export async function loadToken(): Promise<string | null> {
  cached = await SecureStore.getItemAsync(KEY);
  return cached;
}

export function getCachedToken(): string | null {
  return cached;
}

export async function setToken(token: string): Promise<void> {
  cached = token;
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  cached = null;
  await SecureStore.deleteItemAsync(KEY);
}
