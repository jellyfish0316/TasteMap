import type { Collection } from "@/types/collection";
import type { ImportCandidate, ImportConfirmPayload, ImportJob } from "@/types/import";
import type { PlaceCandidate } from "@/types/place";

import { api } from "./client";

export const importApi = {
  // Kick off an async import; returns the pending job to poll.
  async create(url: string): Promise<ImportJob> {
    const { data } = await api.post<ImportJob>("/imports", { url });
    return data;
  },

  async get(jobId: string): Promise<ImportJob> {
    const { data } = await api.get<ImportJob>(`/imports/${jobId}`);
    return data;
  },

  async candidates(jobId: string): Promise<ImportCandidate[]> {
    const { data } = await api.get<ImportCandidate[]>(`/imports/${jobId}/candidates`);
    return data;
  },

  // Pin an unmatched/ambiguous candidate to a place the user picked by hand.
  async resolveCandidate(
    jobId: string,
    candidateId: string,
    place: PlaceCandidate,
  ): Promise<ImportCandidate> {
    const { data } = await api.post<ImportCandidate>(
      `/imports/${jobId}/candidates/${candidateId}/resolve`,
      { place },
    );
    return data;
  },

  async confirm(jobId: string, payload: ImportConfirmPayload): Promise<Collection> {
    const { data } = await api.post<Collection>(`/imports/${jobId}/confirm`, payload);
    return data;
  },
};
