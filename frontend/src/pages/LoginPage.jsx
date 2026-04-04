import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const MAX_ATTEMPTS = 4;

const LoginPage = ({ onSwitch }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [status, setStatus]         = useState(null);   // { type, message, attempts?, locked? }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setStatus({ type: "error", message: "Please enter your email/phone and password." });
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      await login({ identifier, password });
      // success: AuthContext handles token storage; App.jsx redirects to dashboard
    } catch (error) {
      const data    = error.response?.data;
      const code    = data?.error?.code;
      const details = data?.error?.details;

      if (code === "ACCOUNT_LOCKED") {
        setStatus({
          type:    "warning",
          locked:  true,
          lockUntil: details?.lockUntil,
          message: data.message
        });
      } else {
        const attemptsRemaining = details?.attemptsRemaining ?? null;
        const usedAttempts = attemptsRemaining !== null ? MAX_ATTEMPTS - attemptsRemaining : 0;
        setStatus({
          type:     "error",
          message:  data?.message || "Invalid credentials. Please try again.",
          attempts: usedAttempts
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const usedDots = status?.attempts ?? 0;

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-icon">🔐</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue to ResQFood</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Identifier */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-identifier">Email or Phone</label>
          <input
            id="login-identifier"
            className="form-input"
            type="text"
            placeholder="you@email.com or +91 98765…"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            disabled={loading || status?.locked}
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="login-password"
              className="form-input"
              type={showPass ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading || status?.locked}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                color: "var(--clr-muted)", cursor: "pointer", fontSize: 16
              }}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Attempt indicator dots */}
        {usedDots > 0 && !status?.locked && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: "0.78rem", color: "var(--clr-muted)", marginBottom: 6 }}>
              Failed attempts
            </p>
            <div className="attempt-dots">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <span key={i} className={`attempt-dot ${i < usedDots ? "used" : ""}`} />
              ))}
            </div>
          </div>
        )}

        <button
          id="btn-login-submit"
          className="btn-primary"
          type="submit"
          disabled={loading || status?.locked}
        >
          {loading && <span className="btn-spinner" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Alert banners */}
      {status && (
        <div className={`alert alert-${status.type}`}>
          <span className="alert-icon">
            {status.type === "warning" ? "🔒" : "⚠️"}
          </span>
          <div>
            <span>{status.message}</span>
            {status.locked && status.lockUntil && (
              <div style={{ fontSize: "0.78rem", marginTop: 4, opacity: 0.8 }}>
                Try again after {new Date(status.lockUntil).toLocaleTimeString("en-IN")}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="switch-text">
        New here?{" "}
        <button id="btn-go-register" className="switch-btn" onClick={onSwitch}>
          Create an account
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
