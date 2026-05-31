import type { PlaceCandidate, PlaceDetail, PlaceSummary, Recommendation } from "@tastemap/types";

import { client } from "./client";

export const placeApi = {
  // Distinct places I've saved — the pins for the map.
  async myMap(): Promise<PlaceSummary[]> {
    const { data } = await client().get<PlaceSummary[]>("/places/me");
    return data;
  },

  // Pins from the public lists of people I follow.
  async followingMap(): Promise<PlaceSummary[]> {
    const { data } = await client().get<PlaceSummary[]>("/places/following");
    return data;
  },

  async get(placeId: string): Promise<PlaceDetail> {
    const { data } = await client().get<PlaceDetail>(`/places/${placeId}`);
    return data;
  },

  // My cards for one place, across all my lists.
  async recommendations(placeId: string): Promise<Recommendation[]> {
    const { data } = await client().get<Recommendation[]>(`/places/${placeId}/recommendations`);
    return data;
  },

  async search(query: string, region?: string): Promise<PlaceCandidate[]> {
    const { data } = await client().get<PlaceCandidate[]>("/places/search", {
      params: { q: query, region },
    });
    return data;
  },
};
