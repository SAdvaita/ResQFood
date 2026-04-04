import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, setAccessTokenHeader } from "../api/client";

const AuthContext = createContext(null);

const STORAGE_KEY = "resqfood_access_token";

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [user, setUser]               = useState(null);
  const [initialising, setInitialising] = useState(true);

  // ── Set bearer token on every accessToken change ──────
  useEffect(() => {
    setAccessTokenHeader(accessToken);
  }, [accessToken]);

  // ── On mount: try to restore session via refresh token cookie ─
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setInitialising(false);
        return;
      }
      try {
        setAccessTokenHeader(stored);
        const res = await apiClient.post("/identity/auth/refresh", {});
        const { accessToken: newToken, user: userData } = res.data.data;
        localStorage.setItem(STORAGE_KEY, newToken);
        setAccessToken(newToken);
        setAccessTokenHeader(newToken);
        setUser(userData);
      } catch {
        // refresh token expired or revoked — clear storage
        localStorage.removeItem(STORAGE_KEY);
        setAccessToken("");
        setAccessTokenHeader("");
      } finally {
        setInitialising(false);
      }
    };

    restore();
  }, []);

  // ── Register ──────────────────────────────────────────
  const register = useCallback(async (payload) => {
    const res   = await apiClient.post("/identity/auth/register", payload);
    const { accessToken: token, user: userData } = res.data.data;
    localStorage.setItem(STORAGE_KEY, token);
    setAccessToken(token);
    setAccessTokenHeader(token);
    setUser(userData);
    return res.data;
  }, []);

  // ── Login ─────────────────────────────────────────────
  const login = useCallback(async (payload) => {
    const res   = await apiClient.post("/identity/auth/login", payload);
    const { accessToken: token, user: userData } = res.data.data;
    localStorage.setItem(STORAGE_KEY, token);
    setAccessToken(token);
    setAccessTokenHeader(token);
    setUser(userData);
    return res.data;
  }, []);

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/identity/auth/logout", {});
    } finally {
      // always clear client-side regardless of server response
      localStorage.removeItem(STORAGE_KEY);
      setAccessToken("");
      setAccessTokenHeader("");
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ accessToken, user, initialising, register, login, logout }),
    [accessToken, user, initialising, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
