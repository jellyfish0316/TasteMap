// Mirrors backend app/schemas/place.py and the Google match candidate.

export interface PlaceSummary {
  id: string;
  google_place_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  user_rating_count: number | null;
  google_maps_uri: string | null;
}

export interface PlaceDetail extends PlaceSummary {
  phone: string | null;
  opening_hours: Record<string, unknown> | null;
  photos: unknown[] | null;
}

// Result of GET /places/search (Google Places proxy).
export interface PlaceCandidate {
  google_place_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  user_rating_count: number | null;
  google_maps_uri: string | null;
}
