import { create } from "zustand";

import { errorMessage } from "@/api/client";
import { importApi } from "@/api/importApi";
import type { ImportCandidate, ImportConfirmPayload, ImportJob } from "@/types/import";
import type { PlaceCandidate } from "@/types/place";

const POLL_INTERVAL_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ImportState {
  job: ImportJob | null;
  candidates: ImportCandidate[];
  submitting: boolean;
  error: string | null;
  // Whether the global background indicator is showing (in-flight OR a finished
  // result the user hasn't acknowledged yet).
  indicatorVisible: boolean;
  // Submit a URL and poll until the worker finishes, then load candidates.
  startImport: (url: string) => Promise<ImportJob | null>;
  // Load an existing job + its candidates (e.g. opening the review page directly).
  loadResult: (jobId: string) => Promise<void>;
  confirm: (payload: ImportConfirmPayload) => Promise<string | null>;
  // Manually pin a candidate to a chosen place; flips it to matched in place.
  resolveCandidate: (candidateId: string, place: PlaceCandidate) => Promise<boolean>;
  // Hide the background indicator (the user opened the review, or dismissed it).
  dismissIndicator: () => void;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  job: null,
  candidates: [],
  submitting: false,
  error: null,
  indicatorVisible: false,

  async startImport(url) {
    set({ submitting: true, error: null, job: null, candidates: [], indicatorVisible: true });
    try {
      let job = await importApi.create(url);
      set({ job });
      // Poll until the job leaves a non-terminal state.
      while (job.status === "pending" || job.status === "running") {
        await sleep(POLL_INTERVAL_MS);
        job = await importApi.get(job.id);
        set({ job });
      }
      if (job.status === "succeeded") {
        set({ candidates: await importApi.candidates(job.id) });
      } else if (job.status === "failed") {
        set({ error: job.error ?? "Import failed" });
      }
      set({ submitting: false });
      return job;
    } catch (err) {
      set({ submitting: false, error: errorMessage(err, "Import failed") });
      return null;
    }
  },

  async loadResult(jobId) {
    if (get().job?.id === jobId && get().candidates.length) return;
    try {
      const job = await importApi.get(jobId);
      const candidates = job.status === "succeeded" ? await importApi.candidates(jobId) : [];
      set({ job, candidates });
    } catch (err) {
      set({ error: errorMessage(err, "Could not load import") });
    }
  },

  async confirm(payload) {
    const job = get().job;
    if (!job) return null;
    try {
      const collection = await importApi.confirm(job.id, payload);
      return collection.id;
    } catch (err) {
      set({ error: errorMessage(err, "Could not save to a collection") });
      return null;
    }
  },

  async resolveCandidate(candidateId, place) {
    const job = get().job;
    if (!job) return false;
    try {
      const updated = await importApi.resolveCandidate(job.id, candidateId, place);
      set({ candidates: get().candidates.map((c) => (c.id === candidateId ? updated : c)) });
      return true;
    } catch (err) {
      set({ error: errorMessage(err, "Could not resolve this place") });
      return false;
    }
  },

  dismissIndicator() {
    set({ indicatorVisible: false });
  },

  reset() {
    set({ job: null, candidates: [], submitting: false, error: null, indicatorVisible: false });
  },
}));
