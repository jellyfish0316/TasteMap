import { create } from "zustand";

import { errorMessage } from "@/api/client";
import { placeApi } from "@/api/placeApi";
import type { Recommendation } from "@/types/collection";
import type { PlaceDetail, PlaceSummary } from "@/types/place";

interface MapState {
  pins: PlaceSummary[];
  loading: boolean;
  error: string | null;
  // selected pin detail
  selectedPlace: PlaceDetail | null;
  selectedRecs: Recommendation[];
  selectedLoading: boolean;
  fetchMap: () => Promise<void>;
  selectPlace: (placeId: string) => Promise<void>;
  clearSelection: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  pins: [],
  loading: false,
  error: null,
  selectedPlace: null,
  selectedRecs: [],
  selectedLoading: false,

  async fetchMap() {
    set({ loading: true, error: null });
    try {
      // My pins + pins from the public lists of people I follow, deduped by place id.
      const [mine, following] = await Promise.all([placeApi.myMap(), placeApi.followingMap()]);
      const byId = new Map<string, PlaceSummary>();
      for (const p of [...mine, ...following]) byId.set(p.id, p);
      set({ pins: [...byId.values()], loading: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err, "Could not load your map") });
    }
  },

  // Open a pin: load the shared place detail + my cards for it together.
  async selectPlace(placeId) {
    set({ selectedLoading: true, selectedPlace: null, selectedRecs: [] });
    try {
      const [place, recs] = await Promise.all([
        placeApi.get(placeId),
        placeApi.recommendations(placeId),
      ]);
      set({ selectedPlace: place, selectedRecs: recs, selectedLoading: false });
    } catch (err) {
      set({ selectedLoading: false, error: errorMessage(err, "Could not load place") });
    }
  },

  clearSelection() {
    set({ selectedPlace: null, selectedRecs: [] });
  },
}));
