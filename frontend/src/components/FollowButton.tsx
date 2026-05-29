import { useState } from "react";

import { socialApi } from "@/api/socialApi";

/** Optimistic follow/unfollow toggle, reusable on search rows and profiles. */
export default function FollowButton({
  userId,
  initialFollowing,
  onChange,
}: {
  userId: string;
  initialFollowing: boolean;
  onChange?: (following: boolean) => void;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !following;
    try {
      if (next) await socialApi.follow(userId);
      else await socialApi.unfollow(userId);
      setFollowing(next);
      onChange?.(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={busy}
      className={
        following
          ? "rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
          : "rounded-full bg-orange-600 px-3 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
