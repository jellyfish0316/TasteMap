import { errorMessage, socialApi } from "@tastemap/api-client";
import type { Collection, FeedItem, UserPublic } from "@tastemap/types";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CollectionDetailModal, CollectionRow } from "@/components/CollectionDetailView";
import { Avatar, EmptyState, Field, IconButton, ScreenHeader } from "@/components/mobileUi";
import { useAuthStore } from "@/stores/authStore";

export default function ExploreScreen() {
  const { ready, token } = useAuthStore();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserPublic[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    void socialApi.feed().then(setFeed).catch(() => setFeed([]));
  }, [ready, token]);

  useEffect(() => {
    if (!ready || !token) return;
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      void socialApi.search(term).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, ready, token]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <ScreenHeader title="探索" subtitle="追蹤朋友，把他們的公開清單放進你的 TasteMap" />
      <View className="px-4">
        <Field
          value={q}
          onChangeText={setQ}
          placeholder="搜尋使用者 · search people"
          autoCapitalize="none"
        />
      </View>

      {q.trim() ? (
        <FlatList
          data={results}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<EmptyState title="找不到使用者" body="換個 username 或顯示名稱試試。" />}
          renderItem={({ item }) => <UserRow user={item} onOpen={() => setProfileId(item.id)} />}
        />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(f) => f.collection.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={
            <Text className="mb-1 font-sans text-xs font-extrabold uppercase tracking-wide text-ink-3">
              追蹤對象的清單
            </Text>
          }
          ListEmptyComponent={
            <EmptyState title="還沒有動態" body="搜尋並追蹤一些人，這裡就會出現他們的公開清單。" />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCollectionId(item.collection.id)}
              className="rounded-md bg-surface p-4 shadow-sh-1"
            >
              <View className="flex-row items-center gap-3">
                <Avatar label={item.owner.display_name || item.owner.username} />
                <View className="flex-1">
                  <Text className="font-sans text-base font-extrabold text-ink">
                    {item.collection.name}
                  </Text>
                  <Text className="mt-1 font-sans text-sm text-ink-3">
                    by {item.owner.display_name || `@${item.owner.username}`}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      <CollectionDetailModal
        collectionId={collectionId}
        onClose={() => setCollectionId(null)}
        editable={false}
      />
      <UserProfileModal
        userId={profileId}
        onClose={() => setProfileId(null)}
        onOpenCollection={(id) => {
          setProfileId(null);
          setCollectionId(id);
        }}
      />
    </SafeAreaView>
  );
}

function UserRow({ user, onOpen }: { user: UserPublic; onOpen: () => void }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !following;
    setFollowing(next); // optimistic
    try {
      if (next) await socialApi.follow(user.id);
      else await socialApi.unfollow(user.id);
    } catch {
      setFollowing(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-row items-center gap-3 rounded-md bg-surface p-3 shadow-sh-1">
      <Pressable onPress={onOpen} className="flex-1 flex-row items-center gap-3">
        <Avatar label={user.display_name || user.username} />
        <View className="flex-1">
          <Text className="font-sans text-base font-bold text-ink">
            {user.display_name || user.username}
          </Text>
          <Text className="font-sans text-sm text-ink-3">@{user.username}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={toggle}
        disabled={busy}
        className={`h-9 justify-center rounded-pill px-4 ${following ? "bg-surface-2" : "bg-accent"}`}
      >
        <Text
          className={`font-sans text-sm font-bold ${following ? "text-ink-2" : "text-on-accent"}`}
        >
          {following ? "追蹤中" : "追蹤"}
        </Text>
      </Pressable>
    </View>
  );
}

function UserProfileModal({
  userId,
  onClose,
  onOpenCollection,
}: {
  userId: string | null;
  onClose: () => void;
  onOpenCollection: (id: string) => void;
}) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setCollections([]);
      setError(null);
      return;
    }
    setError(null);
    void Promise.all([socialApi.userStatus(userId), socialApi.userCollections(userId)])
      .then(([status, nextCollections]) => {
        setUser(status.user);
        setIsFollowing(status.is_following);
        setCollections(nextCollections);
      })
      .catch((err) => setError(errorMessage(err, "無法讀取使用者")));
  }, [userId]);

  async function toggle() {
    if (!userId) return;
    const next = !isFollowing;
    setBusy(true);
    setIsFollowing(next);
    try {
      if (next) await socialApi.follow(userId);
      else await socialApi.unfollow(userId);
    } catch {
      setIsFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!userId} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View className="flex-1 flex-row items-center gap-3 pr-3">
            <Avatar label={user?.display_name || user?.username || "?"} size={54} />
            <View className="flex-1">
              <Text className="font-sans text-xl font-extrabold text-ink">
                {user?.display_name || user?.username || "使用者"}
              </Text>
              {user?.username && <Text className="font-sans text-sm text-ink-3">@{user.username}</Text>}
            </View>
          </View>
          <IconButton label="關閉" icon="×" onPress={onClose} />
        </View>

        {error ? (
          <View className="p-4">
            <EmptyState title="讀取失敗" body={error} />
          </View>
        ) : (
          <FlatList
            data={collections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
            ListHeaderComponent={
              <Pressable
                onPress={toggle}
                disabled={busy}
                className={`mb-2 h-12 items-center justify-center rounded-md ${
                  isFollowing ? "bg-surface-3" : "bg-accent"
                }`}
              >
                <Text
                  className={`font-sans text-sm font-extrabold ${
                    isFollowing ? "text-ink-2" : "text-on-accent"
                  }`}
                >
                  {isFollowing ? "追蹤中" : "追蹤"}
                </Text>
              </Pressable>
            }
            ListEmptyComponent={<EmptyState title="沒有公開清單" body="這位使用者還沒有公開清單。" />}
            renderItem={({ item }) => (
              <CollectionRow collection={item} onPress={() => onOpenCollection(item.id)} />
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
