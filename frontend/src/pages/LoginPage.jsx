import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../app/authContext.js";
import { getEnv } from "../app/env.js";
import { getGoogleAuthUrl, login } from "../shared/api/authApi.js";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
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
      const data = await login(env.apiUrl, { email, password });
      setAuth({ user: data.user, token: data.token });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    window.location.href = getGoogleAuthUrl(env.apiUrl, callbackUrl, redirect);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-[22rem] rounded-3xl border border-border bg-panel p-8 shadow-card">
        <h1 className="mb-7 text-center text-xl font-semibold text-zinc-100">
          Вход
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
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-hover disabled:opacity-50">
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>
        {env.apiUrl ? (
          <div className="mt-5 border-t border-border-subtle pt-5">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-elevated py-3 text-sm font-medium text-zinc-200 transition hover:bg-panel-hover">
              <GoogleIcon className="h-5 w-5" />
              Войти через Google
            </button>
          </div>
        ) : (
          <p className="mt-5 text-center text-xs text-zinc-500">
            Укажите VITE_API_URL для входа через Google
          </p>
        )}
        <p className="mt-5 text-center text-sm text-zinc-500">
          Нет аккаунта?{" "}
          <Link
            to="/register"
            className="font-medium text-accent hover:text-accent-hover">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
