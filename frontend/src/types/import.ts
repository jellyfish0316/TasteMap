// Mirrors backend app/schemas/import_job.py

export type ImportStatus = "pending" | "running" | "succeeded" | "failed";
export type MatchStatus = "pending" | "matched" | "needs_review" | "unmatched";

export interface ImportJob {
  id: string;
  status: ImportStatus;
  platform: string | null;
  source_type: string | null;
  units_total: number;
  units_failed: number;
  suggested_collection_name: string | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface ImportCandidate {
  id: string;
  name: string;
  region_hint: string | null;
  address_hint: string | null;
  dishes: string[];
  summary: string | null;
  quote: string | null;
  context_tags: string[];
  timestamp_seconds: number | null;
  source_url: string | null;
  platform: string | null;
  author: string | null;
  is_ad: boolean | null;
  is_negative: boolean | null;
  confidence: number | null;
  match_status: MatchStatus;
  matched_place_id: string | null;
  match_options: Record<string, unknown>[] | null;
  selected: boolean;
}

export interface ImportConfirmPayload {
  collection_id?: string;
  new_collection_name?: string;
  is_public?: boolean;
  candidate_ids?: string[];
}
