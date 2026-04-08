/**
 * Volunteer Dashboard (role: volunteer)
 * ───────────────────────────────────────
 * Features:
 *  - Available delivery requests
 *  - Accept delivery & update status (picked_up / delivered)
 *  - My active delivery tracker
 *  - Delivery history & impact metrics
 */
import { useState } from "react";
import toast from "react-hot-toast";
import { PasswordResetModal } from "../components/AuthWidgets";

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderColor: `${color}22` }}>
    <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const STATUS_CHIPS = {
  pending:    { label: "Open",        color: "#60a5fa", bg: "#60a5fa18" },
  assigned:   { label: "Assigned",    color: "#f97316", bg: "#f9731618" },
  picked_up:  { label: "Picked Up",   color: "#fbbf24", bg: "#fbbf2418" },
  delivered:  { label: "Delivered",   color: "#22d3a5", bg: "#22d3a518" },
};

const VolunteerDashboard = ({ user, onLogout }) => {
  const [showReset,  setShowReset]  = useState(false);
  const [activeTab,  setActiveTab]  = useState("available");

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-avatar">
          <div className="avatar-circle" style={{ background: "linear-gradient(135deg, #22d3a5, #0d9488)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="avatar-name">{user.name}</div>
            <div className="avatar-role" style={{ color: "#22d3a5" }}>🚴 Volunteer</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "available", icon: "📋",  label: "Available Pickups" },
            { id: "active",    icon: "🚴",  label: "My Active Run" },
            { id: "history",   icon: "📜",  label: "Delivery History" },
            { id: "profile",   icon: "👤",  label: "Profile" },
          ].map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={onLogout}>🚪 Sign Out</button>
      </aside>

      {/* ── Main Content ─────────────────────────── */}
      <div className="dashboard-main">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              {getGreeting()}, <span style={{ color: "#22d3a5" }}>{user.name.split(" ")[0]}</span> 🚴
            </h1>
            <p className="dash-subtitle">Accept delivery requests and help food reach those in need</p>
          </div>
          <div className="status-indicator">
            <span className="status-dot active-dot-pulse" />
            Online
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="🚴" label="Total Deliveries" value="—"  color="#22d3a5" />
          <StatCard icon="📦" label="In Progress"       value="—"  color="#f97316" />
          <StatCard icon="⭐" label="Rating"            value="—"  color="#fbbf24" />
          <StatCard icon="🌍" label="km Covered"        value="—"  color="#a78bfa" />
        </div>

        {/* Available pickups */}
        <div className="section-title">
          Available Pickups
          <span className="section-badge">Accepting requests</span>
        </div>

        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No deliveries available right now</div>
          <div className="empty-body">
            Deliveries appear here once an NGO claims a donation.
            <br />Stay online to get notified instantly.
          </div>
        </div>

        {/* Active delivery tracker */}
        <div className="section-title" style={{ marginTop: 32 }}>
          My Active Delivery
        </div>
        <div className="active-delivery-card empty">
          <div>🔄</div>
          <div>No active delivery. Accept a request above.</div>
        </div>

        <button className="reset-link" onClick={() => setShowReset(true)}>
          🔑 Reset Password
        </button>
      </div>

      {showReset && <PasswordResetModal onClose={() => setShowReset(false)} />}
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default VolunteerDashboard;
