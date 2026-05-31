// Mobile wiring for the shared @tastemap/api-client. Side-effect module:
// import it once at app startup (from app/_layout.tsx) to configure the client.
import { configureApi } from "@tastemap/api-client";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { useAuthStore } from "@/stores/authStore";
import { clearToken, getCachedToken } from "./storage";

// Mobile can't use the web's relative "/api/v1" — it needs an absolute URL.
// In dev we derive the dev machine's LAN IP from Expo's host so a phone running
// Expo Go automatically reaches the backend. Override with EXPO_PUBLIC_API_BASE_URL.
function resolveBaseURL(): string {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (override) return override;

  if (!Constants.isDevice) {
    const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
    return `http://${host}:8000/api/v1`;
  }

  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:8000/api/v1` : "http://localhost:8000/api/v1";
}

configureApi({
  baseURL: resolveBaseURL(),
  getToken: () => getCachedToken(),
  onUnauthorized: () => {
    // Clear the session; the root layout watches the store's `token` and
    // redirects to /login whenever it becomes null. Keeps navigation out of
    // this side-effect module (which loads before the router tree exists).
    void clearToken();
    useAuthStore.setState({ token: null, user: null });
  },
});
