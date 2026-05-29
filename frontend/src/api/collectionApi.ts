import type {
  Collection,
  CollectionCreatePayload,
  CollectionDetail,
  CollectionItemCreatePayload,
  CollectionUpdatePayload,
  Recommendation,
  RecommendationUpdatePayload,
} from "@/types/collection";

import { api } from "./client";

export const collectionApi = {
  async list(): Promise<Collection[]> {
    const { data } = await api.get<Collection[]>("/collections");
    return data;
  },

  async create(payload: CollectionCreatePayload): Promise<Collection> {
    const { data } = await api.post<Collection>("/collections", payload);
    return data;
  },

  async get(collectionId: string): Promise<CollectionDetail> {
    const { data } = await api.get<CollectionDetail>(`/collections/${collectionId}`);
    return data;
  },

  async update(collectionId: string, payload: CollectionUpdatePayload): Promise<Collection> {
    const { data } = await api.patch<Collection>(`/collections/${collectionId}`, payload);
    return data;
  },

  async remove(collectionId: string): Promise<void> {
    await api.delete(`/collections/${collectionId}`);
  },

  // Manually save a chosen Google place into this collection.
  async addItem(collectionId: string, payload: CollectionItemCreatePayload): Promise<Recommendation> {
    const { data } = await api.post<Recommendation>(`/collections/${collectionId}/items`, payload);
    return data;
  },

  async updateItem(
    collectionId: string,
    recId: string,
    payload: RecommendationUpdatePayload,
  ): Promise<Recommendation> {
    const { data } = await api.patch<Recommendation>(
      `/collections/${collectionId}/items/${recId}`,
      payload,
    );
    return data;
  },

  async removeItem(collectionId: string, recId: string): Promise<void> {
    await api.delete(`/collections/${collectionId}/items/${recId}`);
  },
};
