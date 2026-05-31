import { collectionApi } from "@tastemap/api-client";
import type { Collection } from "@tastemap/types";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CollectionDetailModal, CollectionRow } from "@/components/CollectionDetailView";
import { PlaceSearchModal } from "@/components/PlaceSearchModal";
import { Avatar, EmptyState, IconButton, PrimaryButton } from "@/components/mobileUi";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileScreen() {
  const { ready, token, user, logout } = useAuthStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function refresh() {
    if (!ready || !token) return;
    void collectionApi.list().then(setCollections).catch(() => setCollections([]));
  }

  useEffect(() => {
    void refresh();
  }, [ready, token]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <FlatList
        data={collections}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <View className="mb-2">
            <View className="flex-row items-center gap-3 rounded-md bg-surface p-4 shadow-sh-1">
              <Avatar label={user?.display_name || user?.username || "?"} size={56} />
              <View className="flex-1">
                <Text className="font-sans text-xl font-extrabold text-ink">
                  {user?.display_name || user?.username || "—"}
                </Text>
                {user?.username && (
                  <Text className="font-sans text-sm text-ink-3">@{user.username}</Text>
                )}
              </View>
            </View>
            <View className="mt-4">
              <PrimaryButton label="新增地點" onPress={() => setAddOpen(true)} />
            </View>
            <View className="mt-6 flex-row items-end justify-between">
              <View>
                <Text className="font-sans text-xs font-extrabold uppercase tracking-wide text-ink-3">
                  我的清單
                </Text>
                <Text className="mt-1 font-sans text-sm text-ink-3">
                  {collections.length} 個 collections
                </Text>
              </View>
              <IconButton label="重新整理" icon="↻" onPress={refresh} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="還沒有清單" body="建立一個清單，或搜尋店家直接存進地圖。" />
        }
        renderItem={({ item }) => <CollectionRow collection={item} onPress={() => setDetailId(item.id)} />}
        ListFooterComponent={
          <Pressable
            onPress={() => void logout()}
            className="mt-6 h-12 items-center justify-center rounded-md bg-danger-bg"
          >
            <Text className="font-sans text-sm font-bold text-danger">登出</Text>
          </Pressable>
        }
      />
      <CollectionDetailModal
        collectionId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => void refresh()}
      />
      <PlaceSearchModal
        visible={addOpen}
        collections={collections}
        onClose={() => setAddOpen(false)}
        onSaved={() => void refresh()}
      />
    </SafeAreaView>
  );
}
