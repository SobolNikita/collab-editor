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
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-[22rem] rounded-3xl border border-border bg-panel p-8 shadow-card">
        <h1 className="mb-7 text-center text-xl font-semibold text-zinc-100">
          Регистрация
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}
          <label className="block text-xs font-medium text-zinc-400">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            Имя
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться"
              autoComplete="name"
              maxLength={64}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-hover disabled:opacity-50">
            {loading ? "Создание…" : "Создать аккаунт"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-500">
          Уже есть аккаунт?{" "}
          <Link
            to="/login"
            className="font-medium text-accent hover:text-accent-hover">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
