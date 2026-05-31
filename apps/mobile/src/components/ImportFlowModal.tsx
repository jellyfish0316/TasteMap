import { collectionApi, errorMessage } from "@tastemap/api-client";
import type { Collection, ImportCandidate, PlaceCandidate } from "@tastemap/types";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CandidateSearchModal } from "@/components/PlaceSearchModal";
import { Badge, EmptyState, Field, IconButton, PrimaryButton } from "@/components/mobileUi";
import { useImportStore } from "@/stores/importStore";

/**
 * Global import sheet. Visibility + job lifecycle live in `useImportStore`, so the
 * work keeps running (and the floating indicator stays) even after the user closes
 * this sheet and moves to another tab. Mounted once in the root layout.
 */
export function ImportFlowModal() {
  const {
    job,
    candidates,
    working,
    error,
    modalVisible,
    startImport,
    resolveCandidate,
    confirm,
    closeModal,
  } = useImportStore();

  const [url, setUrl] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListPublic, setNewListPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState<ImportCandidate | null>(null);

  const done = !working && job?.status === "succeeded";
  const failed = !working && !!error;
  const matched = candidates.filter((c) => c.match_status === "matched");
  const canConfirm = selectedIds.size > 0 && (!!collectionId || !!newListName.trim());

  // Load collections (save destinations) whenever the sheet opens.
  useEffect(() => {
    if (!modalVisible) return;
    void collectionApi
      .list()
      .then(setCollections)
      .catch(() => setCollections([]));
  }, [modalVisible]);

  // When results arrive, preselect matched candidates + seed the new-list name.
  useEffect(() => {
    if (!done) return;
    setSelectedIds(
      new Set(
        candidates
          .filter((c) => c.selected && c.match_status === "matched")
          .map((c) => c.id),
      ),
    );
    setNewListName(job?.suggested_collection_name ?? "");
    setCollectionId(null);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit() {
    const value = url.trim();
    if (!value) return;
    // Fire and forget — the store polls in the background; this sheet just reacts.
    void startImport(value);
  }

  function toggle(candidate: ImportCandidate) {
    if (candidate.match_status !== "matched") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.add(candidate.id);
      return next;
    });
  }

  async function onResolve(place: PlaceCandidate) {
    if (!resolving) return;
    const ok = await resolveCandidate(resolving.id, place);
    if (ok) {
      const id = resolving.id;
      setSelectedIds((prev) => new Set(prev).add(id));
      setResolving(null);
    }
  }

  // Resolve straight to a backend-ranked option (no search modal needed).
  async function onResolveOption(candidate: ImportCandidate, place: PlaceCandidate) {
    const ok = await resolveCandidate(candidate.id, place);
    if (ok) setSelectedIds((prev) => new Set(prev).add(candidate.id));
  }

  async function onConfirm() {
    setBusy(true);
    const ok = await confirm({
      collection_id: collectionId ?? undefined,
      new_collection_name: collectionId ? undefined : newListName.trim(),
      is_public: collectionId ? undefined : newListPublic,
      candidate_ids: [...selectedIds],
    });
    setBusy(false);
    if (ok) {
      setUrl("");
      setSelectedIds(new Set());
    }
  }

  const headerSubtitle = done
    ? "挑選要儲存的地點"
    : working
      ? "解析完成前你可以先離開,我們會在背景處理"
      : "從社群連結擷取店家,整理成你的地圖";

  return (
    <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="font-sans text-2xl font-extrabold text-ink">匯入推薦</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">{headerSubtitle}</Text>
          </View>
          <IconButton label="關閉" icon="×" onPress={closeModal} />
        </View>

        {/* URL entry — only when nothing is in flight */}
        {!job && !working && !failed && (
          <View className="gap-4 p-4">
            <View className="rounded-md bg-surface p-4 shadow-sh-1">
              <Text className="mb-3 font-sans text-xs font-extrabold uppercase text-ink-3">
                Source URL
              </Text>
              <Field
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="https://instagram.com/reel/..."
              />
              <View className="mt-4">
                <PrimaryButton label="開始匯入" onPress={onSubmit} disabled={!url.trim()} />
              </View>
            </View>
            <EmptyState
              title="支援的來源"
              body="Instagram、YouTube、Threads、X 與 Google Maps。匯入會在背景處理,你可以先去逛其他頁面。"
            />
          </View>
        )}

        {/* In flight — let the user leave; the work continues in the background */}
        {working && (
          <View className="gap-4 p-4">
            <View className="rounded-md bg-surface p-4 shadow-sh-1">
              <Badge tone="warn">處理中</Badge>
              <Text className="mt-3 font-sans text-base font-extrabold text-ink">
                {job?.status === "running" ? "正在解析連結..." : "排隊中..."}
              </Text>
              <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                這可能要一點時間(店家越多越久)。你可以先離開,完成後右下角會提醒你回來查看。
              </Text>
              <View className="mt-4">
                <PrimaryButton label="在背景處理,先去逛逛 →" onPress={closeModal} />
              </View>
            </View>
          </View>
        )}

        {/* Failed */}
        {failed && (
          <View className="gap-4 p-4">
            <View className="rounded-md bg-surface p-4 shadow-sh-1">
              <Badge tone="danger">失敗</Badge>
              <Text className="mt-3 font-sans text-base font-extrabold text-ink">匯入失敗</Text>
              <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                {error ?? "請換一個連結再試一次"}
              </Text>
              <View className="mt-4">
                <PrimaryButton label="重新輸入連結" onPress={onSubmit} />
              </View>
            </View>
          </View>
        )}

        {/* Review — results loaded */}
        {done && (
          <FlatList
            data={candidates}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
            ListHeaderComponent={
              <View className="gap-3">
                <View className="rounded-md bg-surface p-4 shadow-sh-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-base font-extrabold text-ink">
                      找到 {candidates.length} 個候選地點
                    </Text>
                    <Badge tone="ok">{matched.length} 可儲存</Badge>
                  </View>
                  <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                    沒配對成功的地點先保留在這裡,之後可以再做手動配對。
                  </Text>
                </View>

                <View className="gap-3 rounded-md bg-surface p-4 shadow-sh-1">
                  <Text className="font-sans text-xs font-extrabold uppercase text-ink-3">
                    儲存到
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
                  {error && <Text className="font-sans text-sm text-danger">{error}</Text>}
                  <PrimaryButton
                    label={`儲存 ${selectedIds.size} 個地點`}
                    onPress={onConfirm}
                    busy={busy}
                    disabled={!canConfirm}
                  />
                </View>
              </View>
            }
            ListEmptyComponent={
              <EmptyState title="沒有可儲存的候選地點" body="這個來源沒有解析到店家。" />
            }
            renderItem={({ item }) => {
              const disabled = item.match_status !== "matched";
              const selected = selectedIds.has(item.id);
              const options = (item.match_options ?? []) as unknown as PlaceCandidate[];
              const hasOptions = item.match_status === "needs_review" && options.length > 0;
              return (
                <Pressable
                  onPress={() => toggle(item)}
                  disabled={disabled}
                  className="rounded-md bg-surface p-4 shadow-sh-1"
                  style={{ opacity: disabled ? 0.58 : 1 }}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-sans text-base font-extrabold text-ink">
                        {item.name}
                      </Text>
                      <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                        {item.summary || item.region_hint || item.address_hint || "沒有摘要"}
                      </Text>
                    </View>
                    <Badge
                      tone={
                        item.match_status === "matched"
                          ? selected
                            ? "accent"
                            : "ok"
                          : item.match_status === "needs_review"
                            ? "warn"
                            : "danger"
                      }
                    >
                      {item.match_status === "matched"
                        ? selected
                          ? "已選"
                          : "可存"
                        : item.match_status === "needs_review"
                          ? "待確認"
                          : "未配對"}
                    </Badge>
                  </View>
                  {item.dishes.length > 0 && (
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {item.dishes.map((dish) => (
                        <Badge key={dish}>{dish}</Badge>
                      ))}
                    </View>
                  )}
                  {hasOptions && (
                    <View className="mt-3 gap-2">
                      <Text className="font-sans text-xs font-extrabold uppercase text-ink-3">
                        是哪一間?
                      </Text>
                      {options.map((opt) => (
                        <Pressable
                          key={opt.google_place_id}
                          onPress={() => void onResolveOption(item, opt)}
                          className="rounded-md border border-line-2 bg-surface-2 p-3"
                        >
                          <Text className="font-sans text-sm font-extrabold text-ink">
                            {opt.name}
                          </Text>
                          {!!opt.address && (
                            <Text className="mt-0.5 font-sans text-xs text-ink-3">
                              {opt.address}
                            </Text>
                          )}
                          {opt.rating != null && (
                            <Text className="mt-0.5 font-sans text-xs text-ink-3">
                              ★ {opt.rating} · {opt.user_rating_count ?? 0}
                            </Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {item.match_status !== "matched" && (
                    <Pressable
                      onPress={() => setResolving(item)}
                      className="mt-3 h-10 items-center justify-center rounded-md border border-line-2 bg-surface-2"
                    >
                      <Text className="font-sans text-sm font-extrabold text-accent-ink">
                        {hasOptions ? "都不是,手動搜尋" : "手動搜尋配對"}
                      </Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            }}
          />
        )}

        <CandidateSearchModal
          visible={!!resolving}
          title={resolving ? `配對:${resolving.name}` : "手動配對"}
          onClose={() => setResolving(null)}
          onPick={onResolve}
        />
      </SafeAreaView>
    </Modal>
  );
}
