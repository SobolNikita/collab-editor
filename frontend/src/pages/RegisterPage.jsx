import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/authContext.js";
import { getEnv } from "../app/env.js";
import { register } from "../shared/api/authApi.js";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const env = getEnv();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!env.apiUrl) {
      setError("Backend not configured (VITE_API_URL).");
      return;
    }
    setLoading(true);
    try {
      const data = await register(env.apiUrl, {
        email,
        password,
        name: name.trim() || email.split("@")[0],
      });
      setAuth({ user: data.user, token: data.token });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-panel p-6 shadow-lg">
        <h1 className="mb-6 text-center text-lg font-semibold text-slate-100">
          Create account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <label className="block text-xs text-slate-400">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded border border-border bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              autoComplete="name"
              maxLength={64}
              className="mt-1 w-full rounded border border-border bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              className="mt-1 w-full rounded border border-border bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-slate-600 py-2 text-sm font-medium text-white hover:bg-slate-500 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-slate-200 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
