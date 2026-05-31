import { collectionApi, errorMessage, importApi } from "@tastemap/api-client";
import type { Collection, ImportCandidate, ImportJob, PlaceCandidate } from "@tastemap/types";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CandidateSearchModal } from "@/components/PlaceSearchModal";
import { Badge, EmptyState, Field, IconButton, PrimaryButton } from "@/components/mobileUi";

export function ImportFlowModal({
  visible,
  collections,
  onClose,
  onDone,
}: {
  visible: boolean;
  collections: Collection[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [url, setUrl] = useState("");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collectionId, setCollectionId] = useState<string | null>(collections[0]?.id ?? null);
  const [newListName, setNewListName] = useState("");
  const [newListPublic, setNewListPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingCandidate, setResolvingCandidate] = useState<ImportCandidate | null>(null);

  const matched = useMemo(
    () => candidates.filter((candidate) => candidate.match_status === "matched"),
    [candidates],
  );
  const canConfirm = selectedIds.size > 0 && (!!collectionId || !!newListName.trim());

  useEffect(() => {
    if (!visible) return;
    setUrl("");
    setJob(null);
    setCandidates([]);
    setSelectedIds(new Set());
    setCollectionId(collections[0]?.id ?? null);
    setNewListName("");
    setNewListPublic(false);
    setError(null);
  }, [collections, visible]);

  useEffect(() => {
    if (!job || job.status === "succeeded" || job.status === "failed") return;
    const t = setInterval(() => {
      void importApi
        .get(job.id)
        .then((next) => {
          setJob(next);
          if (next.status === "succeeded") {
            void importApi.candidates(next.id).then((items) => {
              setCandidates(items);
              setSelectedIds(
                new Set(
                  items
                    .filter((candidate) => candidate.selected && candidate.match_status === "matched")
                    .map((candidate) => candidate.id),
                ),
              );
              setNewListName(next.suggested_collection_name ?? "");
            });
          } else if (next.status === "failed") {
            setError(next.error ?? "匯入失敗");
          }
        })
        .catch((err) => setError(errorMessage(err, "匯入狀態讀取失敗")));
    }, 1300);
    return () => clearInterval(t);
  }, [job]);

  async function startImport() {
    const value = url.trim();
    if (!value) {
      setError("請貼上 IG、YouTube、Threads、X 或 Google Maps 連結");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await importApi.create(value);
      setJob(next);
    } catch (err) {
      setError(errorMessage(err, "無法開始匯入"));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!job || !canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await importApi.confirm(job.id, {
        collection_id: collectionId ?? undefined,
        new_collection_name: collectionId ? undefined : newListName.trim(),
        is_public: collectionId ? undefined : newListPublic,
        candidate_ids: [...selectedIds],
      });
      onDone();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "儲存匯入結果失敗"));
    } finally {
      setBusy(false);
    }
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

  async function resolveCandidate(place: PlaceCandidate) {
    if (!job || !resolvingCandidate) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await importApi.resolveCandidate(job.id, resolvingCandidate.id, place);
      setCandidates((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (updated.match_status === "matched") {
        setSelectedIds((prev) => new Set(prev).add(updated.id));
      }
      setResolvingCandidate(null);
    } catch (err) {
      setError(errorMessage(err, "手動配對失敗"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="font-sans text-2xl font-extrabold text-ink">匯入推薦</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">
              從社群連結擷取店家，整理成你的地圖
            </Text>
          </View>
          <IconButton label="關閉" icon="×" onPress={onClose} />
        </View>

        {!job ? (
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
              {error && <Text className="mt-3 font-sans text-sm text-danger">{error}</Text>}
              <View className="mt-4">
                <PrimaryButton label="開始匯入" onPress={startImport} busy={busy} />
              </View>
            </View>
            <EmptyState
              title="支援的來源"
              body="Instagram、YouTube、Threads、X 與 Google Maps。沒有 API key 時可在 backend/.env 開 FAKE_IMPORTS=true 測流程。"
            />
          </View>
        ) : (
          <FlatList
            data={candidates}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
            ListHeaderComponent={
              <View className="gap-3">
                {job.status !== "succeeded" ? (
                  <View className="rounded-md bg-surface p-4 shadow-sh-1">
                    <Badge tone={job.status === "failed" ? "danger" : "warn"}>
                      {job.status === "failed" ? "失敗" : "處理中"}
                    </Badge>
                    <Text className="mt-3 font-sans text-base font-extrabold text-ink">
                      {job.status === "failed" ? "匯入失敗" : "正在解析連結..."}
                    </Text>
                    <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                      {job.status === "failed"
                        ? (error ?? job.error ?? "請換一個連結再試一次")
                        : "完成後你可以選擇要存進哪個清單。"}
                    </Text>
                  </View>
                ) : (
                  <View className="gap-3">
                    <View className="rounded-md bg-surface p-4 shadow-sh-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans text-base font-extrabold text-ink">
                          找到 {candidates.length} 個候選地點
                        </Text>
                        <Badge tone="ok">{matched.length} 可儲存</Badge>
                      </View>
                      <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                        沒配對成功的地點先保留在這裡，之後可以再做手動配對。
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
                        onPress={confirm}
                        busy={busy}
                        disabled={!canConfirm}
                      />
                    </View>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              job.status === "succeeded" ? (
                <EmptyState title="沒有可儲存的候選地點" body="這個來源沒有解析到店家。" />
              ) : null
            }
            renderItem={({ item }) => {
              const disabled = item.match_status !== "matched";
              const selected = selectedIds.has(item.id);
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
                  {item.match_status !== "matched" && (
                    <Pressable
                      onPress={() => setResolvingCandidate(item)}
                      className="mt-3 h-10 items-center justify-center rounded-md border border-line-2 bg-surface-2"
                    >
                      <Text className="font-sans text-sm font-extrabold text-accent-ink">
                        手動搜尋配對
                      </Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            }}
          />
        )}
        <CandidateSearchModal
          visible={!!resolvingCandidate}
          title={resolvingCandidate ? `配對：${resolvingCandidate.name}` : "手動配對"}
          onClose={() => setResolvingCandidate(null)}
          onPick={resolveCandidate}
        />
      </SafeAreaView>
    </Modal>
  );
}
