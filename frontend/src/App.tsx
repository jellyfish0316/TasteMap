import { useEffect, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import BackgroundImportIndicator from "@/components/BackgroundImportIndicator";
import { useAuthStore } from "@/stores/authStore";

import CollectionPage from "./pages/CollectionPage";
import ImportReviewPage from "./pages/ImportReviewPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
      <Link to="/" className="text-lg font-semibold text-neutral-900">
        TasteMap
      </Link>
      <nav className="flex items-center gap-4 text-sm text-neutral-600">
        <Link to="/" className="hover:text-neutral-900">
          Map
        </Link>
        <Link to="/profile" className="hover:text-neutral-900">
          {user?.display_name || user?.username || "Profile"}
        </Link>
        <button onClick={logout} className="hover:text-neutral-900">
          Logout
        </button>
      </nav>
    </header>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="min-h-0 flex-1">{children}</main>
      <BackgroundImportIndicator />
    </div>
  );
}

export default function App() {
  const loadMe = useAuthStore((s) => s.loadMe);
  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell>
              <MapPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/import/:jobId"
        element={
          <RequireAuth>
            <AppShell>
              <ImportReviewPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/collections/:collectionId"
        element={
          <RequireAuth>
            <AppShell>
              <CollectionPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
