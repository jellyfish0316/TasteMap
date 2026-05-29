import type { Recommendation } from "@/types/collection";
import type { PlaceDetail } from "@/types/place";

interface PlaceDetailPanelProps {
  place: PlaceDetail | null;
  recs: Recommendation[];
  loading: boolean;
  onClose: () => void;
}

// The pin sheet: shared Google base data + my saved cards (the "two voices":
// the original creator's take, and my own note).
export default function PlaceDetailPanel({ place, recs, loading, onClose }: PlaceDetailPanelProps) {
  if (loading) {
    return <Shell onClose={onClose}>Loading…</Shell>;
  }
  if (!place) return null;

  return (
    <Shell onClose={onClose}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900">{place.name}</h2>
        {place.rating != null && (
          <p className="text-sm text-neutral-600">
            ⭐ {place.rating} {place.user_rating_count ? `(${place.user_rating_count})` : ""}
          </p>
        )}
        {place.address && <p className="text-sm text-neutral-500">{place.address}</p>}
        {place.google_maps_uri && (
          <a
            href={place.google_maps_uri}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-orange-600 hover:underline"
          >
            View on Google Maps ↗
          </a>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {recs.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} />
        ))}
        {recs.length === 0 && <p className="text-sm text-neutral-400">No saved notes yet.</p>}
      </div>
    </Shell>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3 text-sm">
      {rec.dishes.length > 0 && <p className="text-neutral-800">🍽 {rec.dishes.join(" · ")}</p>}
      {rec.context_tags.length > 0 && (
        <p className="mt-1 text-neutral-500">{rec.context_tags.map((t) => `#${t}`).join(" ")}</p>
      )}
      {rec.summary && <p className="mt-1 italic text-neutral-700">“{rec.summary}”</p>}
      {(rec.author || rec.platform) && (
        <p className="mt-2 text-xs text-neutral-500">
          📍 {rec.author ? `@${rec.author}` : "source"}
          {rec.platform ? ` · ${rec.platform}` : ""}
          {rec.source_url && (
            <a href={rec.source_url} target="_blank" rel="noreferrer" className="ml-1 text-orange-600">
              ↗
            </a>
          )}
        </p>
      )}
      <p className="mt-1 text-xs text-neutral-600">
        📝 {rec.note ? rec.note : <span className="text-neutral-400">no personal note</span>}
        {rec.status && <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5">{rec.status}</span>}
      </p>
    </div>
  );
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <aside className="absolute right-0 top-0 z-10 h-full w-80 overflow-y-auto border-l border-neutral-200 bg-white p-4 shadow-lg">
      <button
        onClick={onClose}
        className="mb-2 text-sm text-neutral-400 hover:text-neutral-700"
        aria-label="Close"
      >
        ✕ Close
      </button>
      {children}
    </aside>
  );
}
