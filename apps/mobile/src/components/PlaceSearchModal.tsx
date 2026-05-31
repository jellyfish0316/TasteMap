import { collectionApi, errorMessage, placeApi } from "@tastemap/api-client";
import type { Collection, PlaceCandidate } from "@tastemap/types";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge, EmptyState, Field, IconButton, PrimaryButton } from "@/components/mobileUi";

function placeSearchError(err: unknown): string {
  const message = errorMessage(err, "搜尋失敗");
  if (message.includes("GOOGLE_PLACES_API_KEY")) {
    return "手動搜尋需要 GOOGLE_PLACES_API_KEY。現在可先用 FAKE_IMPORTS=true 的匯入流程測試，不需要實作 parser。";
  }
  if (message.includes("400") || message.toLowerCase().includes("bad request")) {
    return "Google Places 搜尋暫時無法使用。請確認後端有設定 GOOGLE_PLACES_API_KEY，或先使用 fake import 流程。";
  }
  return message;
}

export function PlaceSearchModal({
  visible,
  collections,
  initialCollectionId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  collections: Collection[];
  initialCollectionId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [selected, setSelected] = useState<PlaceCandidate | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(initialCollectionId ?? null);
  const [newListName, setNewListName] = useState("");
  const [newListPublic, setNewListPublic] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !!selected && (!!collectionId || !!newListName.trim());

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setResults([]);
    setSelected(null);
    setCollectionId(initialCollectionId ?? collections[0]?.id ?? null);
    setNewListName("");
    setNewListPublic(false);
    setNote("");
    setError(null);
  }, [collections, initialCollectionId, visible]);

  useEffect(() => {
    const term = query.trim();
    if (!visible || term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setError(null);
      void placeApi
        .search(term, "Taipei")
        .then(setResults)
        .catch((err) => {
          setResults([]);
          setError(placeSearchError(err));
        });
    }, 300);
    return () => clearTimeout(t);
  }, [query, visible]);

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === collectionId),
    [collectionId, collections],
  );

  async function save() {
    if (!selected || !canSave) return;
    setBusy(true);
    setError(null);
    try {
      const collection =
        selectedCollection ??
        (await collectionApi.create({
          name: newListName.trim(),
          is_public: newListPublic,
        }));
      await collectionApi.addItem(collection.id, {
        place: selected,
        note: note.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "新增失敗"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View>
            <Text className="font-sans text-2xl font-extrabold text-ink">新增地點</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">搜尋 Google Places 後存進清單</Text>
          </View>
          <IconButton label="關閉" icon="×" onPress={onClose} />
        </View>

        <FlatList
          data={selected ? [] : results}
          keyExtractor={(item) => item.google_place_id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          ListHeaderComponent={
            <View className="gap-3">
              <Field
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                placeholder="店名、地址或關鍵字"
              />

              {selected && (
                <View className="rounded-md bg-surface p-4 shadow-sh-1">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-sans text-base font-extrabold text-ink">
                        {selected.name}
                      </Text>
                      {selected.address && (
                        <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                          {selected.address}
                        </Text>
                      )}
                    </View>
                    <Pressable onPress={() => setSelected(null)}>
                      <Text className="font-sans text-sm font-bold text-accent-deep">重選</Text>
                    </Pressable>
                  </View>
                  <View className="mt-3 flex-row gap-2">
                    {selected.rating != null && <Badge tone="ok">★ {selected.rating}</Badge>}
                    {selected.user_rating_count != null && (
                      <Badge>{selected.user_rating_count.toLocaleString()} 則評論</Badge>
                    )}
                  </View>
                </View>
              )}

              {selected && (
                <View className="gap-3 rounded-md bg-surface p-4 shadow-sh-1">
                  <Text className="font-sans text-xs font-extrabold uppercase text-ink-3">
                    存到清單
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {collections.map((collection) => (
                      <Pressable
                        key={collection.id}
                        onPress={() => {
                          setCollectionId(collection.id);
                          setNewListName("");
                        }}
                        className={`rounded-pill px-3 py-2 ${
                          collectionId === collection.id ? "bg-accent" : "bg-surface-3"
                        }`}
                      >
                        <Text
                          className={`font-sans text-sm font-bold ${
                            collectionId === collection.id ? "text-on-accent" : "text-ink-2"
                          }`}
                        >
                          {collection.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Field
                    value={newListName}
                    onChangeText={(text) => {
                      setNewListName(text);
                      if (text.trim()) setCollectionId(null);
                    }}
                    placeholder="或建立新清單"
                  />
                  {!!newListName.trim() && (
                    <View className="flex-row items-center justify-between">
                      <Text className="font-sans text-sm font-bold text-ink-2">公開清單</Text>
                      <Switch value={newListPublic} onValueChange={setNewListPublic} />
                    </View>
                  )}
                  <Field
                    value={note}
                    onChangeText={setNote}
                    placeholder="你的筆記（選填）"
                    multiline
                  />
                  {error && <Text className="font-sans text-sm text-danger">{error}</Text>}
                  <PrimaryButton label="加入地圖" onPress={save} busy={busy} disabled={!canSave} />
                </View>
              )}

              {!selected && query.trim().length > 0 && query.trim().length < 2 && (
                <Text className="font-sans text-sm text-ink-3">至少輸入 2 個字元</Text>
              )}
              {!selected && error && <EmptyState title="搜尋失敗" body={error} />}
            </View>
          }
          ListEmptyComponent={
            !selected && query.trim().length >= 2 ? (
              <EmptyState title="沒有結果" body="換個店名或地址試試。" />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              className="rounded-md bg-surface p-4 shadow-sh-1"
            >
              <Text className="font-sans text-base font-extrabold text-ink">{item.name}</Text>
              {item.address && (
                <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">{item.address}</Text>
              )}
              <View className="mt-3 flex-row gap-2">
                {item.rating != null && <Badge tone="ok">★ {item.rating}</Badge>}
                {item.user_rating_count != null && (
                  <Badge>{item.user_rating_count.toLocaleString()} 則評論</Badge>
                )}
              </View>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

export function CandidateSearchModal({
  visible,
  title,
  onClose,
  onPick,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onPick: (place: PlaceCandidate) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setError(null);
      return;
    }
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setError(null);
      void placeApi
        .search(term, "Taipei")
        .then(setResults)
        .catch((err) => {
          setResults([]);
          setError(placeSearchError(err));
        });
    }, 300);
    return () => clearTimeout(t);
  }, [query, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="font-sans text-2xl font-extrabold text-ink">{title}</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">選一個 Google Places 結果</Text>
          </View>
          <IconButton label="關閉" icon="×" onPress={onClose} />
        </View>
        <FlatList
          data={results}
          keyExtractor={(item) => item.google_place_id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          ListHeaderComponent={
            <View className="gap-3">
              <Field
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                placeholder="搜尋正確店名或地址"
              />
              {error && <EmptyState title="搜尋失敗" body={error} />}
            </View>
          }
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <EmptyState title="沒有結果" body="換個關鍵字或地址再試一次。" />
            ) : (
              <EmptyState title="輸入關鍵字" body="至少輸入 2 個字元開始搜尋。" />
            )
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              className="rounded-md bg-surface p-4 shadow-sh-1"
            >
              <Text className="font-sans text-base font-extrabold text-ink">{item.name}</Text>
              {item.address && (
                <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">{item.address}</Text>
              )}
              <View className="mt-3 flex-row gap-2">
                {item.rating != null && <Badge tone="ok">★ {item.rating}</Badge>}
                {item.user_rating_count != null && (
                  <Badge>{item.user_rating_count.toLocaleString()} 則評論</Badge>
                )}
              </View>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
