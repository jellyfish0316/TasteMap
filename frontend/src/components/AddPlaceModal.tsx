import { useState } from "react";

import { errorMessage } from "@/api/client";
import { collectionApi } from "@/api/collectionApi";
import PlaceSearch from "@/components/PlaceSearch";
import { useUserStore } from "@/stores/userStore";
import type { PlaceCandidate } from "@/types/place";

/**
 * Save a place by hand: search Google Places, pick one, drop it into an existing
 * list or a brand-new one — no import needed.
 */
export default function AddPlaceModal({
  onClose,
  onSaved,
  initialPlace = null,
}: {
  onClose: () => void;
  onSaved: () => void;
  initialPlace?: PlaceCandidate | null;
}) {
  const { collections, createCollection } = useUserStore();
  const [place, setPlace] = useState<PlaceCandidate | null>(initialPlace);
  const [target, setTarget] = useState<"new" | string>(collections[0]?.id ?? "new");
  const [newName, setNewName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (!place) return;
    setSaving(true);
    setError(null);
    try {
      let collectionId = target;
      if (target === "new") {
        const created = await createCollection({
          name: newName.trim() || place.name,
          is_public: isPublic,
        });
        if (!created) throw new Error("Could not create list");
        collectionId = created.id;
      }
      await collectionApi.addItem(collectionId, { place, note: note.trim() || null });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Could not save this place"));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Add a place</h2>
          <button onClick={onClose} className="text-sm text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>

        {!place ? (
          <div className="mt-4">
            <PlaceSearch autoFocus onPick={setPlace} />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* chosen place */}
            <div className="flex items-start justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">{place.name}</p>
                {place.address && <p className="text-xs text-neutral-500">{place.address}</p>}
              </div>
              <button
                onClick={() => setPlace(null)}
                className="ml-3 shrink-0 text-xs text-orange-600 hover:underline"
              >
                Change
              </button>
            </div>

            {/* destination */}
            <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={target === "new"} onChange={() => setTarget("new")} />
                New list:
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={place.name}
                  className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-neutral-500">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  public
                </label>
              </label>
              {collections.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={target === c.id} onChange={() => setTarget(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>

            {/* optional note */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Your note (optional)"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="text-sm text-neutral-500">
                Cancel
              </button>
              <button
                onClick={() => void onSave()}
                disabled={saving}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save place"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
