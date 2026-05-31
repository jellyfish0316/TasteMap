import type {
  Collection,
  ImportCandidate,
  ImportConfirmPayload,
  ImportJob,
  PlaceCandidate,
} from "@tastemap/types";

import { client } from "./client";

export const importApi = {
  // Kick off an async import; returns the pending job to poll.
  async create(url: string): Promise<ImportJob> {
    const { data } = await client().post<ImportJob>("/imports", { url });
    return data;
  },

  async get(jobId: string): Promise<ImportJob> {
    const { data } = await client().get<ImportJob>(`/imports/${jobId}`);
    return data;
  },

  async candidates(jobId: string): Promise<ImportCandidate[]> {
    const { data } = await client().get<ImportCandidate[]>(`/imports/${jobId}/candidates`);
    return data;
  },

  // Pin an unmatched/ambiguous candidate to a place the user picked by hand.
  async resolveCandidate(
    jobId: string,
    candidateId: string,
    place: PlaceCandidate,
  ): Promise<ImportCandidate> {
    const { data } = await client().post<ImportCandidate>(
      `/imports/${jobId}/candidates/${candidateId}/resolve`,
      { place },
    );
    return data;
  },

  async confirm(jobId: string, payload: ImportConfirmPayload): Promise<Collection> {
    const { data } = await client().post<Collection>(`/imports/${jobId}/confirm`, payload);
    return data;
  },
};
