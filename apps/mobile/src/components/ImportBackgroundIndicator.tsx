import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useImportStore } from "@/stores/importStore";

/**
 * Floating pill that tracks an import across every screen. While the worker runs
 * the user is free to use other tabs; when it finishes the pill turns into a
 * "review" button that reopens the import sheet. Mounted once in the root layout.
 */
export function ImportBackgroundIndicator() {
  const { job, candidates, working, error, indicatorVisible, modalVisible, openModal, dismissIndicator } =
    useImportStore();

  // Hide while the sheet is open (it shows the same state) or when there's nothing to report.
  if (!indicatorVisible || modalVisible) return null;

  const failed = !working && !!error;
  const done = !working && !failed && job?.status === "succeeded";

  return (
    <SafeAreaView
      edges={["bottom"]}
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 items-center"
    >
      <View className="mb-24 max-w-[92%] flex-row items-center gap-3 rounded-pill bg-ink px-4 py-3 shadow-sh-3">
        {working && (
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-accent" />
            <Text className="font-sans text-xs font-bold text-surface">
              {job?.status === "running" ? `從 ${job.platform ?? "連結"} 匯入中…` : "排隊中…"}
            </Text>
          </View>
        )}

        {done && (
          <Pressable onPress={openModal} hitSlop={8}>
            <Text className="font-sans text-xs font-extrabold text-accent">
              ✓ 找到 {candidates.length} 個地點 — 查看
            </Text>
          </Pressable>
        )}

        {failed && (
          <Text className="font-sans text-xs font-bold text-danger" numberOfLines={1}>
            ✕ {error}
          </Text>
        )}

        {!working && (
          <Pressable onPress={dismissIndicator} hitSlop={8} accessibilityLabel="關閉提示">
            <Text className="font-sans text-sm font-bold text-ink-3">×</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
