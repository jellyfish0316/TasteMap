// Mirrors backend app/schemas/collection.py and recommendation.py

import type { PlaceSummary } from "./place";

// A saved restaurant-in-collection with its source context + the user's overlay.
export interface Recommendation {
  id: string;
  collection_id: string;
  place: PlaceSummary;
  // source context (the original creator's voice)
  platform: string | null;
  author: string | null;
  source_url: string | null;
  dishes: string[];
  summary: string | null;
  quote: string | null;
  context_tags: string[];
  timestamp_seconds: number | null;
  is_ad: boolean | null;
  is_negative: boolean | null;
  confidence: number | null;
  // the user's own overlay
  status: string | null;
  note: string | null;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  source_platform: string | null;
  created_at: string;
}

export interface CollectionDetail extends Collection {
  recommendations: Recommendation[];
}

export interface CollectionCreatePayload {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface CollectionUpdatePayload {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export interface RecommendationUpdatePayload {
  status?: string | null;
  note?: string | null;
}
