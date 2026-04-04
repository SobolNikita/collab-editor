import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../app/authContext.js";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");
    const redirect = searchParams.get("redirect") || "/";

    if (token) {
      let user = null;
      try {
        if (userRaw) user = JSON.parse(decodeURIComponent(userRaw));
      } catch {
        console.error("Failed to parse user from search params");
      }
      const data = { token, user: user || { id: "", email: "", name: "User" } };
      setAuth(data);
      navigate(redirect, { replace: true });
      return;
    }
    navigate("/login", { replace: true });
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface text-zinc-400">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent" />
      <p className="text-sm">Вход…</p>
    </div>
  );
}
