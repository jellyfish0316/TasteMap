import "../global.css";
// Side-effect: configure the shared API client (base URL, token, 401 handler)
// before any screen makes a request.
import "@/lib/api";

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";

export default function RootLayout() {
  const { ready, token, bootstrap } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Restore any saved session on launch.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Redirect based on auth: signed-out users to /login, signed-in users away
  // from it. Wait until bootstrap finished so we don't flicker.
  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === "login";
    if (!token && !inAuthGroup) {
      router.replace("/login");
    } else if (token && inAuthGroup) {
      router.replace("/");
    }
  }, [ready, token, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
