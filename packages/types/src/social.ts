// Mirrors backend app/schemas/social.py — the L2 Taste Circle.

import type { Collection } from "./collection";

// Public view of a user (no email / private fields).
export interface UserPublic {
  id: string;
  username: string;
  display_name: string | null;
}

export interface FollowStatus {
  user: UserPublic;
  is_following: boolean;
}

// One public collection surfaced from someone you follow.
export interface FeedItem {
  owner: UserPublic;
  collection: Collection;
  created_at: string;
}
