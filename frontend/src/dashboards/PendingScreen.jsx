/**
 * PendingScreen
 * Shown to Restaurant / NGO users who have registered but not yet been approved by admin.
 */
const ROLE_META = {
  customer: { icon: "🍽️", label: "Restaurant",  color: "#f97316" },
  ngo:      { icon: "🤝", label: "NGO",         color: "#60a5fa" },
};

const PendingScreen = ({ user, onLogout }) => {
  const meta = ROLE_META[user.role] || { icon: "👤", label: user.role, color: "#94a3b8" };

  return (
    <div className="pending-page">
      <div className="pending-card">
        {/* Animated clock */}
        <div className="pending-icon-wrap">
          <div className="pending-icon">⏳</div>
          <div className="pending-pulse" />
        </div>

        <h1 className="pending-title">Awaiting Approval</h1>
        <p className="pending-subtitle">
          Your <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span> account
          is under review by our admin team.
        </p>

        <div className="pending-steps">
          <div className="pending-step done">
            <div className="step-dot done-dot">✓</div>
            <div className="step-label">Account created</div>
          </div>
          <div className="step-line" />
          <div className="pending-step active">
            <div className="step-dot active-dot">2</div>
            <div className="step-label">Admin review</div>
          </div>
          <div className="step-line" />
          <div className="pending-step">
            <div className="step-dot">3</div>
            <div className="step-label">Access granted</div>
          </div>
        </div>

        <div className="pending-info-boxes">
          <div className="pending-info-box">
            <div className="pib-label">Your Name</div>
            <div className="pib-value">{user.name}</div>
          </div>
          <div className="pending-info-box">
            <div className="pib-label">Role</div>
            <div className="pib-value" style={{ color: meta.color }}>{meta.icon} {meta.label}</div>
          </div>
          <div className="pending-info-box">
            <div className="pib-label">Status</div>
            <div className="pib-value">
              <span className="badge-status badge-pending">Pending</span>
            </div>
          </div>
        </div>

        <p className="pending-note">
          ⏱ Approval typically takes less than 24 hours. You will receive an email and SMS
          notification once your account is approved.
        </p>

        <button className="btn-danger" onClick={onLogout} style={{ marginTop: 8 }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
};

export default PendingScreen;
