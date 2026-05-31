import type { Recommendation } from "@tastemap/types";
import { Linking, Pressable, Text, View } from "react-native";

// The recurring unit, ported from the design prototype's VoiceBlock.
// Expresses the "two voices": the creator's voice (imported source) on top,
// then the user's own note/status in a distinct dashed-amber panel below.
export default function PlaceCard({ rec }: { rec: Recommendation }) {
  const hasCreator = !!(rec.author || rec.summary || rec.platform);
  const hasUserVoice = !!(rec.note || rec.status);

  return (
    <View className="rounded-md bg-surface p-4 shadow-sh-1">
      <Text className="font-sans text-base font-extrabold text-ink">{rec.place.name}</Text>

      {/* creator's voice */}
      {hasCreator ? (
        <View className="mt-2">
          <View className="flex-row items-center gap-2">
            {rec.platform && <PlatformChip platform={rec.platform} />}
            {rec.author && (
              <Text className="font-sans text-sm font-bold text-ink">@{rec.author}</Text>
            )}
            {rec.owner && (
              <Text className="font-sans text-xs font-bold text-accent-ink">
                · @{rec.owner.username} 收藏
              </Text>
            )}
          </View>
          {rec.summary && (
            <Text className="mt-2 font-sans text-sm leading-5 text-ink">{rec.summary}</Text>
          )}
          {rec.quote && (
            <View className="mt-2 border-l-[3px] border-accent bg-accent-wash px-3 py-2">
              <Text className="font-sans text-sm italic leading-5 text-accent-ink">
                {rec.quote}
              </Text>
            </View>
          )}
          {rec.dishes.length > 0 && (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {rec.dishes.map((d, i) => (
                <View key={i} className="rounded-pill border border-line bg-surface-2 px-2.5 py-1">
                  <Text className="font-sans text-xs font-semibold text-ink-2">🍽 {d}</Text>
                </View>
              ))}
            </View>
          )}
          {rec.source_url != null && (
            <Pressable
              className="mt-2"
              onPress={() => {
                const url = rec.source_url;
                if (url) void Linking.openURL(url);
              }}
            >
              <Text className="font-sans text-xs font-semibold text-ink-3">🔗 來源</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="mt-2 flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-md bg-accent-tint">
            <Text className="text-accent-deep">＋</Text>
          </View>
          <Text className="font-sans text-sm font-bold text-ink">你新增 · Added by you</Text>
        </View>
      )}

      {/* the user's voice — visually distinct */}
      {hasUserVoice && (
        <View className="mt-3 rounded-sm border border-dashed border-accent bg-accent-wash px-3 py-2.5">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="font-sans text-[11px] font-extrabold uppercase tracking-wide text-accent-deep">
              📝 你的筆記 · Your note
            </Text>
            {rec.status && <StatusChip status={rec.status} />}
          </View>
          {rec.note && <Text className="font-sans text-sm leading-5 text-ink">{rec.note}</Text>}
        </View>
      )}
    </View>
  );
}

function PlatformChip({ platform }: { platform: string }) {
  return (
    <View className="rounded-md bg-ink px-1.5 py-0.5">
      <Text className="font-sans text-[10px] font-extrabold uppercase text-surface">
        {platform.slice(0, 2)}
      </Text>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  const visited = status === "visited";
  return (
    <View className={`rounded-pill px-2.5 py-0.5 ${visited ? "bg-ok-bg" : "bg-accent-tint"}`}>
      <Text className={`font-sans text-xs font-bold ${visited ? "text-ok" : "text-accent-ink"}`}>
        {visited ? "去過" : "想去"}
      </Text>
    </View>
  );
}
