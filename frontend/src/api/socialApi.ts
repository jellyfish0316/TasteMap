import type { Collection } from "@/types/collection";
import type { FeedItem, FollowStatus, UserPublic } from "@/types/social";

import { api } from "./client";

export const socialApi = {
  // --- follow graph --- //
  async follow(followeeId: string): Promise<void> {
    await api.post("/social/follows", { followee_id: followeeId });
  },

  async unfollow(followeeId: string): Promise<void> {
    await api.delete(`/social/follows/${followeeId}`);
  },

  async following(): Promise<UserPublic[]> {
    const { data } = await api.get<UserPublic[]>("/social/following");
    return data;
  },

  async followers(): Promise<UserPublic[]> {
    const { data } = await api.get<UserPublic[]>("/social/followers");
    return data;
  },

  // --- discovery --- //
  async search(q: string): Promise<UserPublic[]> {
    const { data } = await api.get<UserPublic[]>("/social/search", { params: { q } });
    return data;
  },

  async userStatus(targetId: string): Promise<FollowStatus> {
    const { data } = await api.get<FollowStatus>(`/social/users/${targetId}`);
    return data;
  },

  async userCollections(targetId: string): Promise<Collection[]> {
    const { data } = await api.get<Collection[]>(`/social/users/${targetId}/collections`);
    return data;
  },

  // --- explore feed (public lists from people you follow) --- //
  async feed(): Promise<FeedItem[]> {
    const { data } = await api.get<FeedItem[]>("/social/feed");
    return data;
  },
};
