/**
 * Restaurant Dashboard (role: customer / employee)
 * ─────────────────────────────────────────────────
 * Features:
 *  - Stats overview (total donations, active, delivered)
 *  - Email verification banner
 *  - Quick-access action cards
 *  - Recent activity list (placeholder for real API)
 */
import { useState } from "react";
import toast from "react-hot-toast";
import EmailVerifyBanner, { PasswordResetModal } from "../components/AuthWidgets";

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderColor: `${color}22` }}>
    <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const ActionCard = ({ icon, title, desc, onClick, color }) => (
  <button className="action-card" onClick={onClick}>
    <div className="action-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div className="action-title">{title}</div>
    <div className="action-desc">{desc}</div>
  </button>
);

const RestaurantDashboard = ({ user, onLogout }) => {
  const [showReset, setShowReset] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ──────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-avatar">
          <div className="avatar-circle" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="avatar-name">{user.name}</div>
            <div className="avatar-role" style={{ color: "#f97316" }}>🍽️ Restaurant</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "overview",  icon: "📊", label: "Overview" },
            { id: "donate",    icon: "➕", label: "New Donation" },
            { id: "mydonations", icon: "📋", label: "My Donations" },
            { id: "profile",   icon: "👤", label: "Profile" },
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
        <EmailVerifyBanner user={user} />

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              {getGreeting()}, <span style={{ color: "#f97316" }}>{user.name.split(" ")[0]}</span> 🍽️
            </h1>
            <p className="dash-subtitle">Help fight food waste by listing surplus food</p>
          </div>
          <button
            className="btn-accent"
            onClick={() => setActiveTab("donate")}
          >
            ➕ List Food
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📦" label="Total Donations"  value="—"  color="#f97316" />
          <StatCard icon="✅" label="Delivered"         value="—"  color="#22d3a5" />
          <StatCard icon="🔄" label="In Progress"       value="—"  color="#60a5fa" />
          <StatCard icon="⭐" label="Impact Score"      value="—"  color="#a78bfa" />
        </div>

        {/* Quick Actions */}
        <div className="section-title">Quick Actions</div>
        <div className="action-grid">
          <ActionCard
            icon="🍱" title="List Surplus Food"
            desc="Post available food for NGOs to claim"
            color="#f97316"
            onClick={() => { setActiveTab("donate"); toast("Opening donation form…"); }}
          />
          <ActionCard
            icon="📋" title="View My Listings"
            desc="Track status of your food posts"
            color="#22d3a5"
            onClick={() => setActiveTab("mydonations")}
          />
          <ActionCard
            icon="🔑" title="Reset Password"
            desc="Update your account password"
            color="#a78bfa"
            onClick={() => setShowReset(true)}
          />
          <ActionCard
            icon="📞" title="Support"
            desc="Contact ResQFood team"
            color="#60a5fa"
            onClick={() => toast("Support: support@resqfood.com")}
          />
        </div>

        {/* Recent Donations placeholder */}
        <div className="section-title" style={{ marginTop: 32 }}>Recent Donations</div>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No donations yet</div>
          <div className="empty-body">Start by listing surplus food using the button above</div>
        </div>
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

export default RestaurantDashboard;
