import { collectionApi } from "@tastemap/api-client";
import { colors } from "@tastemap/tokens";
import type { Collection, PlaceSummary } from "@tastemap/types";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { CollectionDetailModal, CollectionRow } from "@/components/CollectionDetailView";
import { PlaceDetailSheet } from "@/components/PlaceDetailSheet";
import { PlaceSearchModal } from "@/components/PlaceSearchModal";
import { EmptyState, IconButton } from "@/components/mobileUi";
import { useAuthStore } from "@/stores/authStore";
import { useImportStore } from "@/stores/importStore";
import { useMapStore } from "@/stores/mapStore";

const INITIAL_REGION = {
  latitude: 25.033,
  longitude: 121.5654,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type MapPin = PlaceSummary & {
  lat: number;
  lng: number;
  isMine: boolean;
  isFollowing: boolean;
};

function validCoordinate(pin: PlaceSummary): { lat: number; lng: number } | null {
  const lat = Number(pin.lat);
  const lng = Number(pin.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export default function MapScreen() {
  const { ready, token } = useAuthStore();
  const { pins, minePins, followingPins, fetchMap } = useMapStore();
  const [filter, setFilter] = useState<"all" | "mine" | "following">("all");
  const [selected, setSelected] = useState<PlaceSummary | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collectionDetailId, setCollectionDetailId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const openImport = useImportStore((s) => s.openModal);

  async function refresh() {
    if (!ready || !token) return;
    void fetchMap();
    void collectionApi.list().then(setCollections).catch(() => setCollections([]));
  }

  useEffect(() => {
    void refresh();
  }, [ready, token]);

  const minePinIds = useMemo(() => new Set(minePins.map((pin) => pin.id)), [minePins]);
  const followingPinIds = useMemo(
    () => new Set(followingPins.map((pin) => pin.id)),
    [followingPins],
  );

  const mapPins = useMemo<MapPin[]>(() => {
    return pins.flatMap((pin) => {
      const coordinate = validCoordinate(pin);
      if (!coordinate) return [];
      return [
        {
          ...pin,
          ...coordinate,
          isMine: minePinIds.has(pin.id),
          isFollowing: followingPinIds.has(pin.id),
        },
      ];
    });
  }, [followingPinIds, minePinIds, pins]);

  const visiblePins = useMemo(() => {
    if (filter === "mine") return mapPins.filter((pin) => pin.isMine);
    if (filter === "following") return mapPins.filter((pin) => pin.isFollowing);
    return mapPins;
  }, [filter, mapPins]);

  const visiblePinIds = useMemo(
    () => new Set(visiblePins.map((pin) => pin.id)),
    [visiblePins],
  );

  return (
    <View className="flex-1 bg-bg">
      <MapView provider={PROVIDER_DEFAULT} style={{ flex: 1 }} initialRegion={INITIAL_REGION}>
        {mapPins.map((pin) => {
          const visible = visiblePinIds.has(pin.id);
          return (
          <Marker
            key={pin.id}
            identifier={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            opacity={visible ? 1 : 0.01}
            pinColor={pin.isMine ? colors.pin.mine : colors.pin.circle}
            tracksViewChanges={false}
            onPress={() => {
              if (visible) setSelected(pin);
            }}
          />
          );
        })}
      </MapView>

      {/* floating title */}
      <SafeAreaView
        edges={["top"]}
        className="absolute left-0 right-0 top-0"
        pointerEvents="box-none"
      >
        <View className="mx-4 mt-2 flex-row items-center">
          <Pressable
            onPress={() => setSearchOpen(true)}
            className="h-14 flex-1 flex-row items-center rounded-pill bg-surface px-4 shadow-sh-2"
          >
            <Text className="mr-3 font-sans text-3xl text-ink-3">⌕</Text>
            <Text
              className="flex-1 font-sans text-lg font-extrabold text-ink-3"
              numberOfLines={1}
            >
              搜尋餐廳、地點...
            </Text>
          </Pressable>
        </View>
        <View className="mx-4 mt-5 flex-row gap-2">
          {[
            ["all", "全部"],
            ["mine", "我的收藏"],
            ["following", "追蹤中"],
          ].map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setFilter(id as "all" | "mine" | "following")}
              className={`h-9 justify-center rounded-pill px-4 shadow-sh-1 ${
                filter === id ? "bg-ink" : "bg-surface"
              }`}
            >
              <Text
                className={`font-sans text-xs font-extrabold ${
                  filter === id ? "text-surface" : "text-ink-2"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="absolute right-4 top-36 rounded-md border border-line bg-surface px-3 py-2 shadow-sh-2">
          <View className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full bg-accent" />
            <Text className="font-sans text-[11px] font-bold text-ink-2">我的收藏</Text>
          </View>
          <View className="mt-1 flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full bg-[#0e7490]" />
            <Text className="font-sans text-[11px] font-bold text-ink-2">追蹤的人</Text>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0">
        <Pressable
          onPress={openImport}
          className="absolute bottom-24 right-4 h-12 flex-row items-center justify-center gap-2 rounded-pill bg-accent px-5 shadow-sh-3"
        >
          <Text className="font-sans text-base font-extrabold text-on-accent">↗ 貼連結匯入</Text>
        </Pressable>
        <View className="mx-3 mb-3 flex-row gap-2">
          <Pressable
            onPress={() => setCollectionsOpen(true)}
            className="flex-1 rounded-lg border border-line bg-surface px-4 py-3 shadow-sh-3"
          >
            <Text className="font-sans text-base font-extrabold text-ink">你的地圖</Text>
            <Text className="mt-0.5 font-sans text-xs font-semibold text-ink-3">
              {visiblePins.length} 個地點 · {collections.length} 個清單
            </Text>
          </Pressable>
          <Pressable
            onPress={refresh}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sh-2"
          >
            <Text className="font-sans text-base font-extrabold text-ink">↻</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <PlaceDetailSheet
        placeId={selected?.id ?? null}
        onClose={() => setSelected(null)}
        onAdd={() => {
          setSelected(null);
          setSearchOpen(true);
        }}
      />
      <PlaceSearchModal
        visible={searchOpen}
        collections={collections}
        onClose={() => setSearchOpen(false)}
        onSaved={() => void refresh()}
      />
      <CollectionsModal
        visible={collectionsOpen}
        collections={collections}
        onClose={() => setCollectionsOpen(false)}
        onOpenImport={() => {
          setCollectionsOpen(false);
          openImport();
        }}
        onOpenList={(id) => {
          setCollectionsOpen(false);
          setCollectionDetailId(id);
        }}
      />
      <CollectionDetailModal
        collectionId={collectionDetailId}
        onClose={() => setCollectionDetailId(null)}
        onChanged={() => void refresh()}
        onOpenPlace={(id) => {
          setCollectionDetailId(null);
          setSelected({ id } as PlaceSummary);
        }}
      />
    </View>
  );
}

function CollectionsModal({
  visible,
  collections,
  onClose,
  onOpenImport,
  onOpenList,
}: {
  visible: boolean;
  collections: Collection[];
  onClose: () => void;
  onOpenImport: () => void;
  onOpenList: (id: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <View>
            <Text className="font-sans text-2xl font-extrabold text-ink">你的清單</Text>
            <Text className="mt-1 font-sans text-sm text-ink-3">整理想吃、去過與朋友推薦</Text>
          </View>
          <IconButton label="關閉" icon="×" onPress={onClose} />
        </View>

        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          ListHeaderComponent={
            <Pressable
              onPress={onOpenImport}
              className="mb-2 rounded-md border border-accent bg-accent-wash p-4"
            >
              <Text className="font-sans text-base font-extrabold text-accent-ink">
                從連結匯入推薦
              </Text>
              <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">
                貼上社群或地圖連結，自動建立地點卡片。
              </Text>
            </Pressable>
          }
          ListEmptyComponent={
            <EmptyState title="還沒有清單" body="先匯入連結，或用搜尋手動新增一家店。" />
          }
          renderItem={({ item }) => (
            <CollectionRow collection={item} onPress={() => onOpenList(item.id)} />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
