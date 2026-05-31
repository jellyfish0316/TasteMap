import "../global.css";
// Side-effect: configure the shared API client (base URL, token, 401 handler)
// before any screen makes a request.
import "@/lib/api";

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ImportBackgroundIndicator } from "@/components/ImportBackgroundIndicator";
import { ImportFlowModal } from "@/components/ImportFlowModal";
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
        {/* Global import surfaces: the sheet + the cross-screen progress pill. Only
            once signed in — they read the import store, which is empty otherwise. */}
        {token && (
          <>
            <ImportFlowModal />
            <ImportBackgroundIndicator />
          </>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
