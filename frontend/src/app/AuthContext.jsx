import { useCallback, useMemo, useState } from "react";
import { getStoredAuth, setStoredAuth } from "../shared/api/authApi.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const setAuthState = useCallback((data) => {
    setAuth(data);
    setStoredAuth(data);
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    setStoredAuth(null);
  }, []);

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? "",
      isAuthenticated: Boolean(auth?.token),
      setAuth: setAuthState,
      logout,
    }),
    [auth, setAuthState, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
