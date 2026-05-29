import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { collectionApi } from "@/api/collectionApi";
import { errorMessage } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import type { CollectionDetail } from "@/types/collection";

export default function CollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Only the owner may edit/delete; others (via Explore) get a read-only view.
  const isOwner = !!detail && detail.user_id === currentUserId;

  const load = useCallback(async () => {
    if (!collectionId) return;
    try {
      setDetail(await collectionApi.get(collectionId));
    } catch (err) {
      setError(errorMessage(err, "Could not load collection"));
    }
  }, [collectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeItem(recId: string) {
    if (!collectionId) return;
    await collectionApi.removeItem(collectionId, recId);
    void load();
  }

  async function deleteCollection() {
    if (!collectionId || !detail) return;
    if (!window.confirm(`Delete "${detail.name}" and all its places?`)) return;
    await collectionApi.remove(collectionId);
    navigate("/");
  }

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!detail) return <p className="p-6 text-sm text-neutral-400">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">{detail.name}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {detail.is_public ? "public" : "private"} · {detail.recommendations.length} places
          </span>
          {isOwner && (
            <button
              onClick={() => void deleteCollection()}
              className="text-xs text-neutral-400 hover:text-red-600"
            >
              Delete list
            </button>
          )}
        </div>
      </div>
      {detail.description && <p className="mt-1 text-sm text-neutral-500">{detail.description}</p>}

      <ul className="mt-4 space-y-2">
        {detail.recommendations.map((rec) => (
          <li key={rec.id} className="flex items-start justify-between rounded-lg border border-neutral-200 p-3">
            <div className="min-w-0">
              <p className="font-medium text-neutral-900">{rec.place.name}</p>
              {rec.dishes.length > 0 && (
                <p className="text-sm text-neutral-600">🍽 {rec.dishes.join(" · ")}</p>
              )}
              {rec.summary && <p className="text-sm italic text-neutral-600">“{rec.summary}”</p>}
              {rec.note && <p className="mt-1 text-sm text-neutral-700">📝 {rec.note}</p>}
              {(rec.author || isOwner) && (
                <p className="mt-1 text-xs text-neutral-400">
                  {rec.author ? `@${rec.author}${rec.platform ? ` · ${rec.platform}` : ""}` : "added by you"}
                </p>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => void removeItem(rec.id)}
                className="ml-3 shrink-0 text-xs text-neutral-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </li>
        ))}
        {detail.recommendations.length === 0 && (
          <p className="text-sm text-neutral-400">This list is empty.</p>
        )}
      </ul>
    </div>
  );
}
