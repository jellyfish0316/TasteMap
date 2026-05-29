import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { errorMessage } from "@/api/client";
import { socialApi } from "@/api/socialApi";
import FollowButton from "@/components/FollowButton";
import type { FeedItem, UserPublic } from "@/types/social";

// L2 Taste Circle: find people, follow them, and browse their public lists.
export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPublic[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [following, feedItems] = await Promise.all([socialApi.following(), socialApi.feed()]);
      setFollowingIds(new Set(following.map((u) => u.id)));
      setFeed(feedItems);
    } catch (err) {
      setError(errorMessage(err, "Could not load your circle"));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      setResults(await socialApi.search(query.trim()));
    } catch (err) {
      setError(errorMessage(err, "Search failed"));
    }
  }

  function onFollowChange(userId: string, following: boolean) {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      following ? next.add(userId) : next.delete(userId);
      return next;
    });
    void socialApi.feed().then(setFeed); // feed depends on who you follow
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-neutral-900">Explore</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Follow people to see the lists they’ve made public.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* find people */}
      <form onSubmit={onSearch} className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find people by name or @handle"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
            >
              <Link to={`/u/${u.id}`} className="min-w-0">
                <span className="block font-medium text-neutral-900">
                  {u.display_name || u.username}
                </span>
                <span className="block text-xs text-neutral-400">@{u.username}</span>
              </Link>
              <FollowButton
                userId={u.id}
                initialFollowing={followingIds.has(u.id)}
                onChange={(f) => onFollowChange(u.id, f)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* explore feed */}
      <h2 className="mb-2 mt-8 text-xs font-medium uppercase tracking-wide text-neutral-400">
        From people you follow
      </h2>
      {feed.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Nothing yet — follow someone with public lists to fill this up.
        </p>
      ) : (
        <ul className="space-y-2">
          {feed.map((item) => (
            <li key={item.collection.id}>
              <Link
                to={`/collections/${item.collection.id}`}
                className="block rounded-lg border border-neutral-200 p-3 hover:border-orange-400 hover:bg-orange-50"
              >
                <span className="block font-medium text-neutral-900">{item.collection.name}</span>
                {item.collection.description && (
                  <span className="block text-sm text-neutral-500">{item.collection.description}</span>
                )}
                <span className="mt-1 block text-xs text-neutral-400">
                  by {item.owner.display_name || `@${item.owner.username}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
