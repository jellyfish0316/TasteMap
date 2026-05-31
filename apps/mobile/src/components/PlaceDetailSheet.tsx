import { errorMessage, placeApi } from "@tastemap/api-client";
import type { PlaceDetail, Recommendation } from "@tastemap/types";
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PlaceCard from "@/components/PlaceCard";
import { Badge, EmptyState, IconButton, PrimaryButton } from "@/components/mobileUi";

export function PlaceDetailSheet({
  placeId,
  onClose,
  onAdd,
}: {
  placeId: string | null;
  onClose: () => void;
  onAdd?: () => void;
}) {
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) {
      setPlace(null);
      setRecs([]);
      setError(null);
      return;
    }
    setError(null);
    void Promise.all([placeApi.get(placeId), placeApi.recommendations(placeId)])
      .then(([nextPlace, nextRecs]) => {
        setPlace(nextPlace);
        setRecs(nextRecs);
      })
      .catch((err) => setError(errorMessage(err, "無法讀取地點")));
  }, [placeId]);

  return (
    <Modal visible={!!placeId} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/20">
        <SafeAreaView edges={["bottom"]} className="max-h-[82%] rounded-t-xl bg-bg">
          <View className="flex-row items-start justify-between gap-3 border-b border-line px-4 py-4">
            <View className="flex-1">
              <Text className="font-sans text-xl font-extrabold text-ink">
                {place?.name ?? "地點"}
              </Text>
              {place?.address && (
                <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">{place.address}</Text>
              )}
              <View className="mt-3 flex-row flex-wrap gap-2">
                {place?.rating != null && <Badge tone="ok">★ {place.rating.toFixed(1)}</Badge>}
                {place?.user_rating_count != null && (
                  <Badge>{place.user_rating_count.toLocaleString()} 則評論</Badge>
                )}
              </View>
            </View>
            <IconButton label="關閉地點" icon="×" onPress={onClose} />
          </View>

          <View className="gap-3 p-4">
            {error ? (
              <EmptyState title="讀取失敗" body={error} />
            ) : recs.length ? (
              recs.slice(0, 2).map((rec) => <PlaceCard key={rec.id} rec={rec} />)
            ) : (
              <EmptyState title="還沒有你的筆記" body="把這家店加入清單，就會出現在你的地圖。" />
            )}

            <View className="flex-row gap-3">
              {place?.google_maps_uri && (
                <View className="flex-1">
                  <PrimaryButton
                    label="Google 地圖"
                    tone="neutral"
                    onPress={() => {
                      const url = place.google_maps_uri;
                      if (url) void Linking.openURL(url);
                    }}
                  />
                </View>
              )}
              <View className="flex-1">
                <PrimaryButton label="加入清單" onPress={() => onAdd?.()} />
              </View>
            </View>
          </View>

          <Pressable onPress={onClose} className="items-center pb-2">
            <Text className="font-sans text-xs font-bold text-ink-3">下滑或點此關閉</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
