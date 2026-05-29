import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, loading, error, token } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (token) {
    navigate("/", { replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") await login({ email, password });
      else await register({ email, username, password });
      navigate("/", { replace: true });
    } catch {
      /* error surfaced via store */
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-neutral-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-neutral-900">TasteMap</h1>
        <p className="text-sm text-neutral-500">
          {mode === "login" ? "Sign in to your map." : "Create your account."}
        </p>

        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        {mode === "register" && (
          <input
            type="text"
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        )}
        <input
          type="password"
          required
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full text-center text-sm text-neutral-500 hover:text-neutral-900"
        >
          {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
