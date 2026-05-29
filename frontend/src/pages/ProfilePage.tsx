import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { collections, fetchCollections } = useUserStore();

  useEffect(() => {
    void fetchCollections();
  }, [fetchCollections]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-neutral-900">
        {user?.display_name || user?.username}
      </h1>
      <p className="text-sm text-neutral-500">@{user?.username}</p>
      <p className="text-sm text-neutral-400">{user?.email}</p>

      <h2 className="mt-6 mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
        Collections ({collections.length})
      </h2>
      <ul className="space-y-1">
        {collections.map((c) => (
          <li key={c.id}>
            <Link
              to={`/collections/${c.id}`}
              className="block rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {c.name}
              {c.is_public && <span className="ml-1 text-xs text-neutral-400">· public</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
