import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const ROLE_LABELS = {
  customer:   { icon: "🍽️", label: "Customer",    color: "#f97316" },
  ngo:        { icon: "🤝", label: "NGO",          color: "#60a5fa" },
  volunteer:  { icon: "🚴", label: "Volunteer",    color: "#22d3a5" },
  admin:      { icon: "🛡️", label: "Admin",        color: "#a78bfa" },
  employee:   { icon: "👷", label: "Employee",     color: "#fbbf24" }
};

const DashboardPage = ({ onLogout }) => {
  const { user, accessToken } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

  if (!user) return null;

  const roleInfo  = ROLE_LABELS[user.role] || { icon: "👤", label: user.role, color: "#94a3b8" };
  const isPending = user.approvalStatus === "pending";

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await onLogout();
    } catch {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Pending banner */}
      {isPending && (
        <div className="pending-banner">
          <span className="pending-banner-icon">⏳</span>
          <div>
            <div className="pending-banner-title">Awaiting Admin Approval</div>
            <div className="pending-banner-body">
              Your {roleInfo.label} account is under review. You will be notified via email and SMS once approved. This usually takes less than 24 hours.
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="dashboard-header">
        <h1 className="dashboard-greeting">
          Good {getTimeOfDay()},{" "}
          <span>{user.name.split(" ")[0]}</span> {roleInfo.icon}
        </h1>
        <p className="dashboard-role">
          Signed in as <strong style={{ color: roleInfo.color }}>{roleInfo.label}</strong>
        </p>
      </div>

      {/* Info cards */}
      <div className="info-grid">
        <div className="info-card">
          <div className="info-card-label">Account Status</div>
          <div className="info-card-value">
            <span className={`badge-status badge-${user.approvalStatus}`}>
              {user.approvalStatus.charAt(0).toUpperCase() + user.approvalStatus.slice(1)}
            </span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-label">Role</div>
          <div className="info-card-value">{roleInfo.label}</div>
        </div>

        <div className="info-card">
          <div className="info-card-label">User ID</div>
          <div className="info-card-value" style={{ fontSize: "0.78rem", fontFamily: "monospace", wordBreak: "break-all" }}>
            {user.id}
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-label">Session Token</div>
          <div className="info-card-value" style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--clr-muted)", wordBreak: "break-all" }}>
            {accessToken ? accessToken.slice(0, 32) + "…" : "—"}
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        id="btn-dashboard-logout"
        className="btn-danger"
        onClick={handleLogout}
        disabled={logoutLoading}
      >
        {logoutLoading ? "Signing out…" : "🚪 Sign Out"}
      </button>
    </div>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

export default DashboardPage;
