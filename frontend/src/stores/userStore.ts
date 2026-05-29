import { create } from "zustand";

import { errorMessage } from "@/api/client";
import { collectionApi } from "@/api/collectionApi";
import type { Collection, CollectionCreatePayload } from "@/types/collection";

// The signed-in user's own data: their collections (the left-panel list).
interface UserState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  createCollection: (payload: CollectionCreatePayload) => Promise<Collection | null>;
}

export const useUserStore = create<UserState>((set, get) => ({
  collections: [],
  loading: false,
  error: null,

  async fetchCollections() {
    set({ loading: true, error: null });
    try {
      set({ collections: await collectionApi.list(), loading: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err, "Could not load collections") });
    }
  },

  async createCollection(payload) {
    try {
      const collection = await collectionApi.create(payload);
      set({ collections: [collection, ...get().collections] });
      return collection;
    } catch (err) {
      set({ error: errorMessage(err, "Could not create collection") });
      return null;
    }
  },
}));
