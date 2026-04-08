import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient, setAccessTokenHeader } from "../api/client";

const AuthContext = createContext(null);

const STORAGE_KEY = "resqfood_access_token";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normaliseUser = (userData) => ({
  id:             userData._id ?? userData.id,
  name:           userData.name,
  email:          userData.email ?? null,
  phone:          userData.phone ?? null,
  role:           userData.role,
  approvalStatus: userData.approvalStatus ?? "pending",
  emailVerified:  userData.emailVerified  ?? false,
  phoneVerified:  userData.phoneVerified  ?? false,
  address:        userData.address        ?? null,
  location:       userData.location       ?? null,
  createdAt:      userData.createdAt      ?? null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [accessToken,  setAccessToken]  = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [user,         setUser]         = useState(null);
  const [initialising, setInitialising] = useState(true);

  // ── Sync Bearer header on token change ─────────
  useEffect(() => {
    setAccessTokenHeader(accessToken);
  }, [accessToken]);

  // ── On mount: restore session via refresh cookie ─
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) { setInitialising(false); return; }
      try {
        setAccessTokenHeader(stored);
        const res = await apiClient.post("/identity/auth/refresh", {});
        const { accessToken: newToken, user: userData } = res.data.data;
        localStorage.setItem(STORAGE_KEY, newToken);
        setAccessToken(newToken);
        setAccessTokenHeader(newToken);

        // Fetch full profile to get emailVerified etc.
        const profileRes = await apiClient.get("/identity/auth/me");
        setUser(normaliseUser(profileRes.data.data.user));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setAccessToken("");
        setAccessTokenHeader("");
        setUser(null);
      } finally {
        setInitialising(false);
      }
    };
    restore();
  }, []);

  // ── Register ──────────────────────────────────
  const register = useCallback(async (payload) => {
    const res = await apiClient.post("/identity/auth/register", payload);
    const { accessToken: token, user: userData } = res.data.data;
    localStorage.setItem(STORAGE_KEY, token);
    setAccessToken(token);
    setAccessTokenHeader(token);
    setUser(normaliseUser(userData));
    return res.data;
  }, []);

  // ── Login ──────────────────────────────────────
  const login = useCallback(async (payload) => {
    const res = await apiClient.post("/identity/auth/login", payload);
    const { accessToken: token, user: userData } = res.data.data;
    localStorage.setItem(STORAGE_KEY, token);
    setAccessToken(token);
    setAccessTokenHeader(token);

    // Fetch full profile with verification flags
    try {
      setAccessTokenHeader(token);
      const profileRes = await apiClient.get("/identity/auth/me");
      setUser(normaliseUser(profileRes.data.data.user));
    } catch {
      setUser(normaliseUser(userData));
    }
    return res.data;
  }, []);

  // ── Logout ────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/identity/auth/logout", {});
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setAccessToken("");
      setAccessTokenHeader("");
      setUser(null);
    }
  }, []);

  // ── Refresh user profile ──────────────────────
  const refreshProfile = useCallback(async () => {
    const res = await apiClient.get("/identity/auth/me");
    setUser(normaliseUser(res.data.data.user));
  }, []);

  // ── Email verification ────────────────────────
  const sendEmailVerification = useCallback(async () => {
    return apiClient.post("/identity/auth/verify-email/send");
  }, []);

  const confirmEmailVerification = useCallback(async (code) => {
    const res = await apiClient.post("/identity/auth/verify-email/confirm", { code });
    await refreshProfile();
    return res.data;
  }, [refreshProfile]);

  // ── Phone OTP ─────────────────────────────────
  const sendPhoneOTP = useCallback(async (phone) => {
    return apiClient.post("/identity/auth/otp/phone/send", { phone });
  }, []);

  const verifyPhoneOTP = useCallback(async (phone, code) => {
    const res = await apiClient.post("/identity/auth/otp/phone/verify", { phone, code });
    await refreshProfile();
    return res.data;
  }, [refreshProfile]);

  // ── Password reset ────────────────────────────
  const requestPasswordReset = useCallback(async (identifier) => {
    return apiClient.post("/identity/auth/password-reset/request", { identifier });
  }, []);

  const confirmPasswordReset = useCallback(async (identifier, code, newPassword) => {
    return apiClient.post("/identity/auth/password-reset/confirm", { identifier, code, newPassword });
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      initialising,
      isLoggedIn: Boolean(accessToken && user),
      // Auth actions
      register,
      login,
      logout,
      refreshProfile,
      // Verification
      sendEmailVerification,
      confirmEmailVerification,
      sendPhoneOTP,
      verifyPhoneOTP,
      // Password reset
      requestPasswordReset,
      confirmPasswordReset,
    }),
    [
      accessToken, user, initialising,
      register, login, logout, refreshProfile,
      sendEmailVerification, confirmEmailVerification,
      sendPhoneOTP, verifyPhoneOTP,
      requestPasswordReset, confirmPasswordReset,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
