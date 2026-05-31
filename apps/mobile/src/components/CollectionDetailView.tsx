import { collectionApi, errorMessage } from "@tastemap/api-client";
import type { Collection, CollectionDetail, Recommendation } from "@tastemap/types";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PlaceCard from "@/components/PlaceCard";
import { Badge, EmptyState, Field, IconButton, PrimaryButton } from "@/components/mobileUi";

export function CollectionRow({
  collection,
  onPress,
}: {
  collection: Collection;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="rounded-md bg-surface p-4 shadow-sh-1">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans text-base font-extrabold text-ink">{collection.name}</Text>
          {collection.description && (
            <Text className="mt-1 font-sans text-sm leading-5 text-ink-3" numberOfLines={2}>
              {collection.description}
            </Text>
          )}
        </View>
        <Badge tone={collection.is_public ? "ok" : "neutral"}>
          {collection.is_public ? "公開" : "私人"}
        </Badge>
      </View>
      {collection.source_platform && (
        <Text className="mt-3 font-sans text-xs font-bold uppercase text-ink-3">
          from {collection.source_platform}
        </Text>
      )}
    </Pressable>
  );
}

export function CollectionDetailModal({
  collectionId,
  onClose,
  onOpenPlace,
  onChanged,
  editable = true,
}: {
  collectionId: string | null;
  onClose: () => void;
  onOpenPlace?: (placeId: string) => void;
  onChanged?: () => void;
  editable?: boolean;
}) {
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Recommendation | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  async function reload() {
    if (!collectionId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await collectionApi.get(collectionId));
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err, "無法讀取清單"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!collectionId) {
      setDetail(null);
      setError(null);
      return;
    }
    void reload();
  }, [collectionId]);

  return (
    <Modal visible={!!collectionId} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="font-sans text-2xl font-extrabold text-ink">
              {detail?.name ?? "清單"}
            </Text>
            {detail && (
              <Text className="mt-1 font-sans text-sm text-ink-3">
                {detail.recommendations.length} 個地點 · {detail.is_public ? "公開" : "私人"}
              </Text>
            )}
          </View>
          <View className="flex-row gap-2">
            {detail && editable && (
              <IconButton label="編輯清單" icon="⋯" onPress={() => setManageOpen(true)} />
            )}
            <IconButton label="關閉" icon="×" onPress={onClose} />
          </View>
        </View>

        {error ? (
          <View className="p-4">
            <EmptyState title="讀取失敗" body={error} />
          </View>
        ) : (
          <FlatList
            data={detail?.recommendations ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
            ListHeaderComponent={
              loading ? (
                <Text className="font-sans text-sm text-ink-3">讀取中...</Text>
              ) : detail?.description ? (
                <Text className="mb-1 font-sans text-sm leading-5 text-ink-2">
                  {detail.description}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <EmptyState title="還沒有地點" body="用搜尋新增地點，或從社群貼文匯入。" />
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => onOpenPlace?.(item.place.id)}>
                <PlaceCard rec={item} />
                {editable && (
                  <View className="-mt-2 mb-1 flex-row gap-2 rounded-b-md bg-surface px-3 pb-3">
                    <Pressable
                      onPress={() => setEditing(item)}
                      className="h-9 flex-1 items-center justify-center rounded-md bg-surface-3"
                    >
                      <Text className="font-sans text-xs font-extrabold text-ink-2">編輯筆記</Text>
                    </Pressable>
                    <Pressable
                      onPress={async () => {
                        if (!collectionId) return;
                        try {
                          await collectionApi.removeItem(collectionId, item.id);
                          await reload();
                        } catch (err) {
                          setError(errorMessage(err, "移除失敗"));
                        }
                      }}
                      className="h-9 flex-1 items-center justify-center rounded-md bg-danger-bg"
                    >
                      <Text className="font-sans text-xs font-extrabold text-danger">移除</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            )}
          />
        )}

        {error && (
          <View className="px-4 pb-4">
            <PrimaryButton label="關閉" onPress={onClose} tone="neutral" />
          </View>
        )}
        <EditRecommendationModal
          rec={editing}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            if (!collectionId || !editing) return;
            try {
              await collectionApi.updateItem(collectionId, editing.id, payload);
              setEditing(null);
              await reload();
            } catch (err) {
              setError(errorMessage(err, "更新失敗"));
            }
          }}
        />
        <ManageCollectionModal
          collection={detail}
          visible={manageOpen}
          onClose={() => setManageOpen(false)}
          onSaved={async () => {
            setManageOpen(false);
            await reload();
          }}
          onDeleted={() => {
            setManageOpen(false);
            onChanged?.();
            onClose();
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

function ManageCollectionModal({
  collection,
  visible,
  onClose,
  onSaved,
  onDeleted,
}: {
  collection: CollectionDetail | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDeleted: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collection || !visible) return;
    setName(collection.name);
    setDescription(collection.description ?? "");
    setIsPublic(collection.is_public);
    setError(null);
  }, [collection, visible]);

  async function save() {
    if (!collection) return;
    if (!name.trim()) {
      setError("請輸入清單名稱");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await collectionApi.update(collection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "更新清單失敗"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!collection) return;
    setBusy(true);
    setError(null);
    try {
      await collectionApi.remove(collection.id);
      onDeleted();
    } catch (err) {
      setError(errorMessage(err, "刪除清單失敗"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View>
            <Text className="font-sans text-2xl font-extrabold text-ink">編輯清單</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">
              名稱、描述與公開狀態
            </Text>
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
          <PrimaryButton label="儲存變更" onPress={save} busy={busy} />
          <PrimaryButton label="刪除清單" onPress={remove} busy={busy} tone="danger" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function EditRecommendationModal({
  rec,
  onClose,
  onSave,
}: {
  rec: Recommendation | null;
  onClose: () => void;
  onSave: (payload: { note?: string | null; status?: string | null }) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>("want");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!rec) return;
    setNote(rec.note ?? "");
    setStatus(rec.status ?? "want");
  }, [rec]);

  async function save() {
    setBusy(true);
    try {
      await onSave({ note: note.trim() || null, status });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!rec} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="font-sans text-2xl font-extrabold text-ink">編輯卡片</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">{rec?.place.name}</Text>
          </View>
          <IconButton label="關閉" icon="×" onPress={onClose} />
        </View>
        <View className="gap-3 p-4">
          <View className="flex-row gap-2">
            {[
              ["want", "想去"],
              ["visited", "去過"],
              [null, "不標記"],
            ].map(([value, label]) => (
              <Pressable
                key={label}
                onPress={() => setStatus(value)}
                className={`h-10 flex-1 items-center justify-center rounded-md ${
                  status === value ? "bg-accent" : "bg-surface-3"
                }`}
              >
                <Text
                  className={`font-sans text-sm font-extrabold ${
                    status === value ? "text-on-accent" : "text-ink-2"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Field value={note} onChangeText={setNote} placeholder="你的筆記" multiline />
          <PrimaryButton label="儲存" onPress={save} busy={busy} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
