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
    <div className="flex min-h-screen items-center justify-center bg-surface text-slate-400">
      Signing you in…
    </div>
  );
}
