import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PlaceSearch from "@/components/PlaceSearch";
import { useImportStore } from "@/stores/importStore";
import { useUserStore } from "@/stores/userStore";
import type { ImportCandidate } from "@/types/import";
import type { PlaceCandidate } from "@/types/place";

export default function ImportReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { job, candidates, loadResult, confirm, resolveCandidate, error } = useImportStore();
  const { collections, fetchCollections } = useUserStore();

  const [target, setTarget] = useState<"new" | string>("new");
  const [newName, setNewName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (jobId) void loadResult(jobId);
    void fetchCollections();
  }, [jobId, loadResult, fetchCollections]);

  // Default: select all matched candidates; seed the new-list name from the source.
  useEffect(() => {
    setPicked(new Set(candidates.filter((c) => c.match_status === "matched").map((c) => c.id)));
  }, [candidates]);
  useEffect(() => {
    if (job?.suggested_collection_name) setNewName(job.suggested_collection_name);
  }, [job?.suggested_collection_name]);

  const matchedCount = useMemo(
    () => candidates.filter((c) => c.match_status === "matched").length,
    [candidates],
  );

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Resolve a candidate to a hand-picked place, then auto-select it for saving.
  async function onResolve(candidateId: string, place: PlaceCandidate) {
    const ok = await resolveCandidate(candidateId, place);
    if (ok) setPicked((prev) => new Set(prev).add(candidateId));
    return ok;
  }

  async function onConfirm() {
    const collectionId = await confirm({
      candidate_ids: [...picked],
      ...(target === "new"
        ? { new_collection_name: newName || undefined, is_public: isPublic }
        : { collection_id: target }),
    });
    if (collectionId) navigate(`/collections/${collectionId}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-neutral-900">Review import</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {job?.platform} · {job?.source_type} · {candidates.length} found · {matchedCount} matched
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* destination */}
      <div className="mt-4 space-y-2 rounded-lg border border-neutral-200 p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={target === "new"} onChange={() => setTarget("new")} />
          New list:
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="List name"
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
          />
          <label className="flex items-center gap-1 text-xs text-neutral-500">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
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

      {/* candidates */}
      <ul className="mt-4 space-y-2">
        {candidates.map((c) => (
          <CandidateRow
            key={c.id}
            c={c}
            checked={picked.has(c.id)}
            onToggle={() => toggle(c.id)}
            onResolve={(place) => onResolve(c.id, place)}
          />
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button onClick={() => navigate("/")} className="text-sm text-neutral-500">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={picked.size === 0}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save {picked.size} to list
        </button>
      </div>
    </div>
  );
}

function CandidateRow({
  c,
  checked,
  onToggle,
  onResolve,
}: {
  c: ImportCandidate;
  checked: boolean;
  onToggle: () => void;
  onResolve: (place: PlaceCandidate) => Promise<boolean>;
}) {
  const matched = c.match_status === "matched";
  const [searching, setSearching] = useState(false);

  return (
    <li className="rounded-lg border border-neutral-200 p-3">
      <div className="flex gap-3">
        <input type="checkbox" checked={checked} disabled={!matched} onChange={onToggle} className="mt-1" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">{c.name}</span>
            <MatchBadge status={c.match_status} />
            {!matched && (
              <button
                type="button"
                onClick={() => setSearching((s) => !s)}
                className="ml-auto shrink-0 text-xs text-orange-600 hover:underline"
              >
                {searching ? "Cancel" : "Search manually"}
              </button>
            )}
          </div>
          {c.dishes.length > 0 && <p className="text-sm text-neutral-600">🍽 {c.dishes.join(" · ")}</p>}
          {c.summary && <p className="text-sm italic text-neutral-600">“{c.summary}”</p>}
          {c.author && <p className="text-xs text-neutral-400">@{c.author}</p>}
        </div>
      </div>

      {!matched && searching && (
        <div className="mt-3 border-t border-neutral-100 pt-3">
          <PlaceSearch
            defaultQuery={`${c.name} ${c.region_hint ?? ""}`.trim()}
            autoFocus
            onPick={async (place) => {
              const ok = await onResolve(place);
              if (ok) setSearching(false);
            }}
          />
        </div>
      )}
    </li>
  );
}

function MatchBadge({ status }: { status: ImportCandidate["match_status"] }) {
  const map: Record<string, string> = {
    matched: "bg-green-100 text-green-700",
    needs_review: "bg-amber-100 text-amber-700",
    unmatched: "bg-neutral-100 text-neutral-500",
    pending: "bg-neutral-100 text-neutral-500",
  };
  return <span className={`rounded px-1.5 py-0.5 text-xs ${map[status]}`}>{status}</span>;
}
