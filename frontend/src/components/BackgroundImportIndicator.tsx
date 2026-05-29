import { useNavigate } from "react-router-dom";

import { useImportStore } from "@/stores/importStore";

// Persistent, global indicator: tracks an import's progress across every page, and
// turns into a "Review" link when it finishes. Imports run in the background (the
// store keeps polling), so the user can keep using the app while one is in flight.
export default function BackgroundImportIndicator() {
  const navigate = useNavigate();
  const { job, candidates, submitting, error, indicatorVisible, dismissIndicator } =
    useImportStore();

  if (!indicatorVisible) return null;

  const failed = !submitting && (!!error || job?.status === "failed");
  const done = !submitting && !failed && job?.status === "succeeded";

  function openReview() {
    if (job) navigate(`/import/${job.id}`);
    dismissIndicator();
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 flex items-center gap-3 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs text-white shadow-lg">
      {/* in progress */}
      {submitting && (
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
          {job?.status === "running"
            ? `Importing from ${job.platform ?? "source"}…`
            : "Queued…"}
        </span>
      )}

      {/* finished — offer the review */}
      {done && (
        <button onClick={openReview} className="flex items-center gap-2 hover:text-orange-300">
          <span className="text-orange-400">✓</span>
          Found {candidates.length} place{candidates.length === 1 ? "" : "s"} — Review
        </button>
      )}

      {/* failed */}
      {failed && (
        <span className="flex items-center gap-2 text-red-300">
          ✕ {error ?? "Import failed"}
        </span>
      )}

      {/* dismiss (only once it's not actively running) */}
      {!submitting && (
        <button
          onClick={dismissIndicator}
          aria-label="Dismiss"
          className="text-neutral-400 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
