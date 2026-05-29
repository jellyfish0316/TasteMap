import { useState, type FormEvent } from "react";

import { errorMessage } from "@/api/client";
import { placeApi } from "@/api/placeApi";
import type { PlaceCandidate } from "@/types/place";

/**
 * Reusable Google Places search box: type a query, pick a result.
 * Used both to resolve an unmatched import candidate and to save a place by hand.
 */
export default function PlaceSearch({
  defaultQuery = "",
  onPick,
  autoFocus = false,
  placeholder = "Search a restaurant",
}: {
  defaultQuery?: string;
  onPick: (place: PlaceCandidate) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      setResults(await placeApi.search(query.trim()));
      setSearched(true);
    } catch (err) {
      setError(errorMessage(err, "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="rounded bg-neutral-800 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {results.length > 0 && (
        <ul className="max-h-56 space-y-1 overflow-y-auto">
          {results.map((r) => (
            <li key={r.google_place_id}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className="w-full rounded border border-neutral-200 px-3 py-2 text-left hover:border-orange-400 hover:bg-orange-50"
              >
                <span className="block text-sm font-medium text-neutral-900">{r.name}</span>
                {r.address && <span className="block text-xs text-neutral-500">{r.address}</span>}
                {r.rating != null && (
                  <span className="text-xs text-neutral-400">
                    ★ {r.rating} · {r.user_rating_count ?? 0}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {searched && results.length === 0 && !searching && (
        <p className="text-xs text-neutral-400">No matches — try adding the city.</p>
      )}
    </div>
  );
}
