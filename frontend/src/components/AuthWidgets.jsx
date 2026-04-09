import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// ─── Email Verification Banner ────────────────────────────────────────────────
const EmailVerifyBanner = ({ user }) => {
  const { sendEmailVerification, confirmEmailVerification } = useAuth();
  const [step, setStep]     = useState("idle"); // idle | sent | verifying
  const [code, setCode]     = useState("");
  const [loading, setLoading] = useState(false);

  if (user.emailVerified) return null;

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await sendEmailVerification();
      const devCode = res?.data?.data?.devCode;
      const deliveryMode = res?.data?.data?.deliveryMode;
      setStep("sent");
      toast.success("Verification code sent to your email!");
      if (deliveryMode === "mock") {
        toast.error("Email service is not configured. Using local mock mode.");
      }
      if (devCode && deliveryMode === "mock") {
        toast.success(`Dev OTP: ${devCode}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmEmailVerification(code);
      toast.success("Email verified! ✓");
      setStep("idle");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-banner">
      <span className="verify-banner-icon">📧</span>
      <div className="verify-banner-body">
        <strong>Email not verified.</strong> Verify your email to unlock all features.
        {step === "idle" && (
          <button className="verify-btn" onClick={handleSend} disabled={loading}>
            {loading ? "Sending…" : "Send Code"}
          </button>
        )}
        {step === "sent" && (
          <form onSubmit={handleVerify} className="verify-form">
            <input
              className="verify-input"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              pattern="[0-9]{6}"
              maxLength={6}
            />
            <button type="submit" className="verify-btn" disabled={loading || code.length !== 6}>
              {loading ? "Verifying…" : "Confirm"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Password Reset Modal ─────────────────────────────────────────────────────
export const PasswordResetModal = ({ onClose }) => {
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const [step, setStep]         = useState("request"); // request | confirm
  const [identifier, setIdent]  = useState("");
  const [code, setCode]         = useState("");
  const [newPass, setNewPass]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await requestPasswordReset(identifier);
      const devCode = res?.data?.data?.devCode;
      const deliveryMode = res?.data?.data?.deliveryMode;
      toast.success("If the account exists, a reset code was sent.");
      if (deliveryMode === "mock") {
        toast.error("Email service is not configured. Using local mock mode.");
      }
      if (devCode && deliveryMode === "mock") {
        toast.success(`Dev reset OTP: ${devCode}`);
      }
      setStep("confirm");
    } catch {
      toast.error("Request failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (newPass.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await confirmPasswordReset(identifier, code, newPass);
      toast.success("Password reset! Please sign in again.");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔑 Reset Password</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === "request" ? (
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label className="form-label">Email or Phone</label>
              <input
                className="form-input"
                placeholder="you@email.com or +91..."
                value={identifier}
                onChange={(e) => setIdent(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading || !identifier}>
              {loading ? "Sending…" : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            <div className="form-group">
              <label className="form-label">6-Digit Code</label>
              <input
                className="form-input"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Min 8 characters"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailVerifyBanner;
