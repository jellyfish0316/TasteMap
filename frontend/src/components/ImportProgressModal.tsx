import { useImportStore } from "@/stores/importStore";

// Blocking overlay shown while an import job is being processed.
export default function ImportProgressModal() {
  const { job, error } = useImportStore();
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
      <div className="w-72 space-y-2 rounded-xl bg-white p-5 text-center shadow-xl">
        <div className="text-sm font-medium text-neutral-900">
          {error ? "Import failed" : "Importing…"}
        </div>
        <p className="text-xs text-neutral-500">
          {error
            ? error
            : job?.status === "running"
              ? `Reading ${job.platform ?? "source"}…`
              : "Queued…"}
        </p>
        {job && job.units_total > 0 && (
          <p className="text-xs text-neutral-400">
            {job.units_total - job.units_failed}/{job.units_total} units
          </p>
        )}
      </div>
    </div>
  );
}
