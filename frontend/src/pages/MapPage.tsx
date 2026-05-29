import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { socialApi } from "@/api/socialApi";
import AddPlaceModal from "@/components/AddPlaceModal";
import MapSearchBar from "@/components/MapSearchBar";
import MapView from "@/components/MapView";
import PlaceDetailPanel from "@/components/PlaceDetailPanel";
import { useImportStore } from "@/stores/importStore";
import { useMapStore } from "@/stores/mapStore";
import { useUserStore } from "@/stores/userStore";
import type { PlaceCandidate } from "@/types/place";
import type { FeedItem } from "@/types/social";

export default function MapPage() {
  const { collections, fetchCollections } = useUserStore();
  const { pins, fetchMap, selectPlace, clearSelection, selectedPlace, selectedRecs, selectedLoading } =
    useMapStore();
  const { startImport, submitting } = useImportStore();
  const [url, setUrl] = useState("");
  // When set, the Add-place modal opens pre-seeded with this place (from the map search bar).
  const [pendingPlace, setPendingPlace] = useState<PlaceCandidate | null>(null);
  // Camera target — a new object each time so the map re-flies even to the same spot.
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  // Public lists from people the user follows (Taste Circle), shown in the sidebar.
  const [feed, setFeed] = useState<FeedItem[]>([]);

  function flyTo(lat: number | null, lng: number | null) {
    if (lat != null && lng != null) setFocus({ lat, lng });
  }

  // Pick from the map search bar: fly there AND open the add dialog seeded with it.
  function onSearchPick(place: PlaceCandidate) {
    flyTo(place.lat, place.lng);
    setPendingPlace(place);
  }

  // Click a saved pin: fly there AND open its detail panel.
  function onSelectPin(placeId: string) {
    const pin = pins.find((p) => p.id === placeId);
    if (pin) flyTo(pin.lat, pin.lng);
    void selectPlace(placeId);
  }

  useEffect(() => {
    void fetchCollections();
    void fetchMap();
    void socialApi.feed().then(setFeed).catch(() => setFeed([]));
  }, [fetchCollections, fetchMap]);

  function onImport(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    // Fire and forget: the store keeps polling in the background and the global
    // indicator tracks progress, so the user is free to navigate while it runs.
    void startImport(url.trim());
    setUrl("");
  }

  return (
    <div className="flex h-full">
      {/* Sidebar: import + collections */}
      <div className="flex w-72 flex-col border-r border-neutral-200 bg-white">
        <form onSubmit={onImport} className="space-y-2 border-b border-neutral-200 p-3">
          <label className="text-xs font-medium text-neutral-500">Import from a link</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste IG / YouTube / X / Maps URL"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-orange-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Importing…" : "Import"}
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Collections
          </h2>
          {collections.length === 0 && (
            <p className="text-sm text-neutral-400">No lists yet. Import something to start.</p>
          )}
          <ul className="space-y-1">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/collections/${c.id}`}
                  className="block rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  {c.name}
                  {c.is_public && <span className="ml-1 text-xs text-neutral-400">· public</span>}
                </Link>
              </li>
            ))}
          </ul>

          {feed.length > 0 && (
            <>
              <h2 className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Following
              </h2>
              <ul className="space-y-1">
                {feed.map((item) => (
                  <li key={item.collection.id}>
                    <Link
                      to={`/collections/${item.collection.id}`}
                      className="block rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      {item.collection.name}
                      <span className="ml-1 text-xs text-neutral-400">
                        · by {item.owner.display_name || `@${item.owner.username}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Map + detail overlay */}
      <div className="relative min-w-0 flex-1">
        <MapSearchBar onPick={onSearchPick} />
        <MapView
          pins={pins}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelectPin={onSelectPin}
          focus={focus}
        />
        {(selectedPlace || selectedLoading) && (
          <PlaceDetailPanel
            place={selectedPlace}
            recs={selectedRecs}
            loading={selectedLoading}
            onClose={clearSelection}
          />
        )}
      </div>

      {pendingPlace && (
        <AddPlaceModal
          initialPlace={pendingPlace}
          onClose={() => setPendingPlace(null)}
          onSaved={() => {
            void fetchMap();
            void fetchCollections();
          }}
        />
      )}
    </div>
  );
}
