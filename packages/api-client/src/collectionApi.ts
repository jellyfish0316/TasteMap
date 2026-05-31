import type {
  Collection,
  CollectionCreatePayload,
  CollectionDetail,
  CollectionItemCreatePayload,
  CollectionUpdatePayload,
  Recommendation,
  RecommendationUpdatePayload,
} from "@tastemap/types";

import { client } from "./client";

export const collectionApi = {
  async list(): Promise<Collection[]> {
    const { data } = await client().get<Collection[]>("/collections");
    return data;
  },

  async create(payload: CollectionCreatePayload): Promise<Collection> {
    const { data } = await client().post<Collection>("/collections", payload);
    return data;
  },

  async get(collectionId: string): Promise<CollectionDetail> {
    const { data } = await client().get<CollectionDetail>(`/collections/${collectionId}`);
    return data;
  },

  async update(collectionId: string, payload: CollectionUpdatePayload): Promise<Collection> {
    const { data } = await client().patch<Collection>(`/collections/${collectionId}`, payload);
    return data;
  },

  async remove(collectionId: string): Promise<void> {
    await client().delete(`/collections/${collectionId}`);
  },

  // Manually save a chosen Google place into this collection.
  async addItem(
    collectionId: string,
    payload: CollectionItemCreatePayload,
  ): Promise<Recommendation> {
    const { data } = await client().post<Recommendation>(
      `/collections/${collectionId}/items`,
      payload,
    );
    return data;
  },

  async updateItem(
    collectionId: string,
    recId: string,
    payload: RecommendationUpdatePayload,
  ): Promise<Recommendation> {
    const { data } = await client().patch<Recommendation>(
      `/collections/${collectionId}/items/${recId}`,
      payload,
    );
    return data;
  },

  async removeItem(collectionId: string, recId: string): Promise<void> {
    await client().delete(`/collections/${collectionId}/items/${recId}`);
  },
};
