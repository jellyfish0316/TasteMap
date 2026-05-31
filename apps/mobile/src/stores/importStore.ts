import { errorMessage, importApi } from "@tastemap/api-client";
import type {
  ImportCandidate,
  ImportConfirmPayload,
  ImportJob,
  PlaceCandidate,
} from "@tastemap/types";
import { create } from "zustand";

import { useMapStore } from "@/stores/mapStore";

const POLL_INTERVAL_MS = 1500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Import job lifecycle, decoupled from any screen so the work keeps running while
 * the user navigates away. `startImport` polls in the background; `modalVisible`
 * drives the import sheet and `indicatorVisible` the floating progress pill — both
 * mounted globally in the root layout.
 */
interface ImportState {
  job: ImportJob | null;
  candidates: ImportCandidate[];
  // true while submitting or while the worker is still processing (pending/running).
  working: boolean;
  error: string | null;
  // The import sheet (URL entry / review) is open.
  modalVisible: boolean;
  // The floating background pill is shown (in-flight OR a finished, unacknowledged result).
  indicatorVisible: boolean;

  openModal: () => void;
  closeModal: () => void;
  startImport: (url: string) => Promise<void>;
  resolveCandidate: (candidateId: string, place: PlaceCandidate) => Promise<boolean>;
  confirm: (payload: ImportConfirmPayload) => Promise<boolean>;
  dismissIndicator: () => void;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  job: null,
  candidates: [],
  working: false,
  error: null,
  modalVisible: false,
  indicatorVisible: false,

  openModal() {
    set({ modalVisible: true });
  },
  closeModal() {
    set({ modalVisible: false });
  },

  async startImport(url) {
    set({
      working: true,
      error: null,
      job: null,
      candidates: [],
      indicatorVisible: true,
      modalVisible: true,
    });
    try {
      let job = await importApi.create(url);
      const id = job.id;
      set({ job });
      // Poll until the worker leaves a non-terminal state. Bail out if a newer
      // import superseded this one (the store only tracks the latest job).
      while (job.status === "pending" || job.status === "running") {
        await sleep(POLL_INTERVAL_MS);
        if (get().job?.id !== id) return;
        job = await importApi.get(id);
        if (get().job?.id !== id) return;
        set({ job });
      }
      if (job.status === "succeeded") {
        const candidates = await importApi.candidates(id);
        if (get().job?.id !== id) return;
        set({ candidates, working: false });
      } else {
        set({ working: false, error: job.error ?? "匯入失敗" });
      }
    } catch (err) {
      set({ working: false, error: errorMessage(err, "匯入失敗") });
    }
  },

  async resolveCandidate(candidateId, place) {
    const job = get().job;
    if (!job) return false;
    try {
      const updated = await importApi.resolveCandidate(job.id, candidateId, place);
      set({ candidates: get().candidates.map((c) => (c.id === updated.id ? updated : c)) });
      return true;
    } catch (err) {
      set({ error: errorMessage(err, "手動配對失敗") });
      return false;
    }
  },

  async confirm(payload) {
    const job = get().job;
    if (!job) return false;
    try {
      await importApi.confirm(job.id, payload);
      void useMapStore.getState().fetchMap();
      set({
        modalVisible: false,
        indicatorVisible: false,
        job: null,
        candidates: [],
        working: false,
        error: null,
      });
      return true;
    } catch (err) {
      set({ error: errorMessage(err, "儲存匯入結果失敗") });
      return false;
    }
  },

  dismissIndicator() {
    set({ indicatorVisible: false });
  },

  reset() {
    set({
      job: null,
      candidates: [],
      working: false,
      error: null,
      modalVisible: false,
      indicatorVisible: false,
    });
  },
}));
