import { useImportStore } from "@/stores/importStore";

// Small persistent indicator so an in-flight import stays visible across pages.
export default function BackgroundImportIndicator() {
  const submitting = useImportStore((s) => s.submitting);
  if (!submitting) return null;
  return (
    <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1.5 text-xs text-white shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
      Importing…
    </div>
  );
}
