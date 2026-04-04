import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "customer",   icon: "🍽️",   name: "Customer",   desc: "Food donor" },
  { value: "ngo",        icon: "🤝",   name: "NGO",        desc: "Food receiver" },
  { value: "volunteer",  icon: "🚴",   name: "Volunteer",  desc: "Delivery hero" },
  { value: "employee",   icon: "👷",   name: "Employee",   desc: "Customer staff" }
];

const defaultForm = {
  name:     "",
  email:    "",
  phone:    "",
  password: "",
  role:     "customer"
};

const RegisterPage = ({ onSwitch }) => {
  const { register } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);   // { type: "success"|"error", message }
  const [showPass, setShowPass] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      setStatus({ type: "error", message: "All fields are required." });
      return;
    }
    if (form.password.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await register(form);

      const needsApproval = !["volunteer"].includes(form.role);
      setStatus({
        type: "success",
        message: needsApproval
          ? `✅ Account created! An admin will review and approve your ${form.role} account.`
          : `✅ ${result.message || "Welcome to ResQFood!"}  You're all set.`
      });
      setForm(defaultForm);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || error.message || "Registration failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-icon">🍱</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join ResQFood and help reduce food waste</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Role selector */}
        <label className="form-label">I am a</label>
        <div className="role-grid">
          {ROLES.map((r) => (
            <div className="role-option" key={r.value}>
              <input
                type="radio"
                id={`role-${r.value}`}
                name="role"
                value={r.value}
                checked={form.role === r.value}
                onChange={set("role")}
              />
              <label className="role-label" htmlFor={`role-${r.value}`}>
                <span className="role-icon">{r.icon}</span>
                <span className="role-name">{r.name}</span>
                <span className="role-desc">{r.desc}</span>
              </label>
            </div>
          ))}
        </div>

        {/* Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            className="form-input"
            type="text"
            placeholder="Arjun Kumar"
            value={form.name}
            onChange={set("name")}
            autoComplete="name"
          />
        </div>

        {/* Email + Phone */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone</label>
            <input
              id="reg-phone"
              className="form-input"
              type="tel"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={set("phone")}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="reg-password"
              className="form-input"
              type={showPass ? "text" : "password"}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
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

        <button id="btn-register-submit" className="btn-primary" type="submit" disabled={loading}>
          {loading && <span className="btn-spinner" />}
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      {status && (
        <div className={`alert alert-${status.type}`}>
          <span className="alert-icon">{status.type === "success" ? "✅" : "❌"}</span>
          <span>{status.message}</span>
        </div>
      )}

      <div className="switch-text">
        Already have an account?{" "}
        <button id="btn-go-login" className="switch-btn" onClick={onSwitch}>
          Sign in
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
