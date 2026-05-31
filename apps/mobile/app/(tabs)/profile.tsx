import { collectionApi } from "@tastemap/api-client";
import type { Collection } from "@tastemap/types";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CollectionDetailModal, CollectionRow } from "@/components/CollectionDetailView";
import { PlaceSearchModal } from "@/components/PlaceSearchModal";
import { Avatar, EmptyState, Field, IconButton, PrimaryButton } from "@/components/mobileUi";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileScreen() {
  const { ready, token, user, logout } = useAuthStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <PrimaryButton label="新增地點" onPress={() => setAddOpen(true)} />
              </View>
              <View className="flex-1">
                <PrimaryButton label="建立清單" tone="neutral" onPress={() => setCreateOpen(true)} />
              </View>
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
      <CreateCollectionModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refresh()}
      />
    </SafeAreaView>
  );
}

function CreateCollectionModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName("");
    setDescription("");
    setIsPublic(false);
    setError(null);
  }, [visible]);

  async function create() {
    if (!name.trim()) {
      setError("請輸入清單名稱");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await collectionApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });
      onCreated();
      onClose();
    } catch {
      setError("建立清單失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View>
            <Text className="font-sans text-2xl font-extrabold text-ink">建立清單</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">例如牛肉麵地圖、下雨天想吃</Text>
          </View>
          <IconButton label="關閉" icon="×" onPress={onClose} />
        </View>
        <View className="gap-3 p-4">
          <Field value={name} onChangeText={setName} placeholder="清單名稱" />
          <Field
            value={description}
            onChangeText={setDescription}
            placeholder="描述（選填）"
            multiline
          />
          <View className="flex-row items-center justify-between rounded-md bg-surface px-4 py-3">
            <Text className="font-sans text-sm font-bold text-ink-2">公開清單</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
          {error && <Text className="font-sans text-sm text-danger">{error}</Text>}
          <PrimaryButton label="建立" onPress={create} busy={busy} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
