import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";

export default function LoginScreen() {
  const { login, register } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  function validate(): string | null {
    if (!email.trim()) return "請輸入 Email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Email 格式不正確";
    if (isRegister) {
      if (username.trim().length < 3) return "使用者名稱至少需要 3 個字元";
      if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
        return "使用者名稱只能使用英文、數字、底線或點";
      }
    }
    if (password.length < 8) return "密碼至少需要 8 個字元";
    return null;
  }

  async function submit() {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      if (isRegister) {
        await register(email.trim(), username.trim(), password, displayName.trim() || undefined);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRegister
            ? "註冊失敗，請檢查欄位"
            : "登入失敗，帳號或密碼錯誤",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="h-56 overflow-hidden">
          <View className="absolute inset-0 scale-125 opacity-70">
            <MiniMapHero />
          </View>
          <View className="absolute inset-0 bg-bg opacity-40" />
          <View className="absolute bottom-8 left-0 right-0 items-center">
            <View className="flex-row items-center gap-3 rounded-pill bg-surface py-2 pl-2 pr-5 shadow-sh-2">
              <View className="h-9 w-9 items-center justify-center rounded-md bg-accent">
                <Text className="font-sans text-lg font-extrabold text-on-accent">餐</Text>
              </View>
              <Text className="font-sans text-2xl font-extrabold text-ink">TasteMap</Text>
            </View>
          </View>
        </View>

        <View className="flex-1 px-7">
          <View className="mb-6 items-center">
            <Text className="text-center font-sans text-[27px] font-extrabold leading-8 text-ink">
              把美食推薦{"\n"}收進<Text className="text-accent">一張地圖</Text>
            </Text>
            <Text className="mt-3 text-center font-sans text-sm leading-6 text-ink-2">
              貼上一則 IG、YouTube 或 Threads 連結，TasteMap 幫你把餐廳釘上地圖。
            </Text>
          </View>

          <View className="gap-3">
            <Field
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {isRegister && (
              <>
                <Field
                  placeholder="使用者名稱 · username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <Field
                  placeholder="顯示名稱 · display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </>
            )}
            <Field
              placeholder="密碼 · password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && <Text className="mt-3 font-sans text-sm text-danger">{error}</Text>}

          <Pressable
            onPress={submit}
            disabled={busy}
            className="mt-6 h-14 items-center justify-center rounded-md bg-accent active:opacity-90"
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-sans text-base font-bold text-on-accent">
                {isRegister ? "建立帳號" : "登入"}
              </Text>
            )}
          </Pressable>

          <Pressable
            className="mt-5 items-center"
            onPress={() => setMode(isRegister ? "login" : "register")}
          >
            <Text className="font-sans text-sm text-ink-3">
              {isRegister ? "已經有帳號了？登入" : "還沒有帳號？建立一個"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MiniMapHero() {
  return (
    <View className="flex-1 bg-[#f1ece2]">
      <View className="absolute -left-12 top-10 h-12 w-[130%] rotate-12 rounded-full bg-[#cfe0dc]" />
      <View className="absolute right-12 top-12 h-24 w-24 rounded-full bg-[#dde6cf]" />
      <View className="absolute left-8 top-32 h-24 w-32 rounded-xl bg-[#dde6cf]" />
      {["18%", "38%", "58%", "78%"].map((top, i) => (
        <View
          key={top}
          className="absolute h-4 w-[120%] rounded-full bg-white"
          style={
            { top, left: "-10%", transform: [{ rotate: i % 2 ? "5deg" : "-6deg" }] } as ViewStyle
          }
        />
      ))}
      {[
        ["22%", "44%"],
        ["68%", "32%"],
        ["46%", "68%"],
      ].map(([left, top]) => (
        <View key={`${left}-${top}`} className="absolute items-center" style={{ left, top } as ViewStyle}>
          <View className="h-9 w-8 items-center rounded-t-full rounded-b-md border-2 border-white bg-accent shadow-pin" />
          <View className="h-3 w-3 -translate-y-2 rotate-45 border-b-2 border-r-2 border-white bg-accent" />
        </View>
      ))}
    </View>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#938b80"
      className="h-14 rounded-md border border-line-2 bg-surface px-4 font-sans text-base text-ink"
    />
  );
}
