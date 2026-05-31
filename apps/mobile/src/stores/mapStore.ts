import { placeApi } from "@tastemap/api-client";
import type { PlaceSummary } from "@tastemap/types";
import { create } from "zustand";

interface MapState {
  pins: PlaceSummary[];
  minePins: PlaceSummary[];
  followingPins: PlaceSummary[];
  loading: boolean;
  fetchMap: () => Promise<void>;
}

function uniquePlaces(places: PlaceSummary[]): PlaceSummary[] {
  const byId = new Map<string, PlaceSummary>();
  for (const place of places) byId.set(place.id, place);
  return [...byId.values()];
}

export const useMapStore = create<MapState>((set) => ({
  pins: [],
  minePins: [],
  followingPins: [],
  loading: false,

  async fetchMap() {
    set({ loading: true });
    try {
      // The user's own saved places + public places from people they follow,
      // deduped by place id (mirrors the web map).
      const [mine, following] = await Promise.all([
        placeApi.myMap().catch(() => [] as PlaceSummary[]),
        placeApi.followingMap().catch(() => [] as PlaceSummary[]),
      ]);
      const uniqueMine = uniquePlaces(mine);
      const uniqueFollowing = uniquePlaces(following);
      set({
        pins: uniquePlaces([...uniqueMine, ...uniqueFollowing]),
        minePins: uniqueMine,
        followingPins: uniqueFollowing,
      });
    } finally {
      set({ loading: false });
    }
  },
}));
