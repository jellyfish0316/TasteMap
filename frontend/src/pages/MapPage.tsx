import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import ImportProgressModal from "@/components/ImportProgressModal";
import MapView from "@/components/MapView";
import PlaceDetailPanel from "@/components/PlaceDetailPanel";
import { useImportStore } from "@/stores/importStore";
import { useMapStore } from "@/stores/mapStore";
import { useUserStore } from "@/stores/userStore";

export default function MapPage() {
  const navigate = useNavigate();
  const { collections, fetchCollections } = useUserStore();
  const { pins, fetchMap, selectPlace, clearSelection, selectedPlace, selectedRecs, selectedLoading } =
    useMapStore();
  const { startImport, submitting, job } = useImportStore();
  const [url, setUrl] = useState("");

  useEffect(() => {
    void fetchCollections();
    void fetchMap();
  }, [fetchCollections, fetchMap]);

  async function onImport(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const result = await startImport(url.trim());
    if (result?.status === "succeeded") {
      setUrl("");
      navigate(`/import/${result.id}`);
    }
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
        </div>
      </div>

      {/* Map + detail overlay */}
      <div className="relative min-w-0 flex-1">
        <MapView
          pins={pins}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelectPin={(id) => void selectPlace(id)}
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

      {submitting && job && <ImportProgressModal />}
    </div>
  );
}
