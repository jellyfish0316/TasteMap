import PlaceSearch from "@/components/PlaceSearch";
import type { PlaceCandidate } from "@/types/place";

/**
 * Google-Maps-style search bar floating over the map. Search a restaurant, pick a
 * result, and hand it up so the caller can add it to a list.
 */
export default function MapSearchBar({ onPick }: { onPick: (place: PlaceCandidate) => void }) {
  return (
    <div className="absolute left-1/2 top-4 z-10 w-[28rem] max-w-[calc(100%-2rem)] -translate-x-1/2">
      <div className="rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/5">
        <PlaceSearch placeholder="🔍 Search a place to add" onPick={onPick} />
      </div>
    </div>
  );
}
