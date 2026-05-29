import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { errorMessage } from "@/api/client";
import { socialApi } from "@/api/socialApi";
import FollowButton from "@/components/FollowButton";
import type { Collection } from "@/types/collection";
import type { FollowStatus } from "@/types/social";

// Another user's public profile: who they are + the lists they've shared.
export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [status, setStatus] = useState<FollowStatus | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const [s, lists] = await Promise.all([
          socialApi.userStatus(userId),
          socialApi.userCollections(userId),
        ]);
        setStatus(s);
        setCollections(lists);
      } catch (err) {
        setError(errorMessage(err, "Could not load this profile"));
      }
    })();
  }, [userId]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!status) return <p className="p-6 text-sm text-neutral-400">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {status.user.display_name || status.user.username}
          </h1>
          <p className="text-sm text-neutral-500">@{status.user.username}</p>
        </div>
        <FollowButton userId={status.user.id} initialFollowing={status.is_following} />
      </div>

      <h2 className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-neutral-400">
        Public lists ({collections.length})
      </h2>
      {collections.length === 0 ? (
        <p className="text-sm text-neutral-400">No public lists yet.</p>
      ) : (
        <ul className="space-y-2">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                to={`/collections/${c.id}`}
                className="block rounded-lg border border-neutral-200 p-3 hover:border-orange-400 hover:bg-orange-50"
              >
                <span className="block font-medium text-neutral-900">{c.name}</span>
                {c.description && (
                  <span className="block text-sm text-neutral-500">{c.description}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
