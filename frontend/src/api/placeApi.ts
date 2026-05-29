import type { Recommendation } from "@/types/collection";
import type { PlaceCandidate, PlaceDetail, PlaceSummary } from "@/types/place";

import { api } from "./client";

export const placeApi = {
  // Distinct places I've saved — the pins for the map.
  async myMap(): Promise<PlaceSummary[]> {
    const { data } = await api.get<PlaceSummary[]>("/places/me");
    return data;
  },

  async get(placeId: string): Promise<PlaceDetail> {
    const { data } = await api.get<PlaceDetail>(`/places/${placeId}`);
    return data;
  },

  // My cards for one place, across all my lists.
  async recommendations(placeId: string): Promise<Recommendation[]> {
    const { data } = await api.get<Recommendation[]>(`/places/${placeId}/recommendations`);
    return data;
  },

  async search(query: string, region?: string): Promise<PlaceCandidate[]> {
    const { data } = await api.get<PlaceCandidate[]>("/places/search", {
      params: { q: query, region },
    });
    return data;
  },
};
