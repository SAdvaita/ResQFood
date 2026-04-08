/**
 * NGO Dashboard (role: ngo)
 * ──────────────────────────
 * Features:
 *  - Browse available food donations (map/list view)
 *  - Claim food listings
 *  - Track my requests history
 *  - Email verification banner
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

const DonationListCard = ({ title, quantity, foodType, distance, onClaim }) => (
  <div className="donation-list-card">
    <div className="dlc-header">
      <div>
        <div className="dlc-title">{title}</div>
        <div className="dlc-meta">
          <span className="food-type-chip">{FOOD_TYPE_ICONS[foodType] ?? "🍽️"} {foodType}</span>
          <span className="dlc-qty">📦 {quantity}</span>
        </div>
      </div>
      <div className="dlc-distance">{distance}</div>
    </div>
    <button className="btn-claim" onClick={onClaim}>Claim Food</button>
  </div>
);

const FOOD_TYPE_ICONS = {
  cooked:    "🍛",
  raw:       "🥬",
  packaged:  "📦",
  bakery:    "🥖",
  beverages: "🥤",
  other:     "🍽️",
};

const NgoDashboard = ({ user, onLogout }) => {
  const [showReset, setShowReset] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-avatar">
          <div className="avatar-circle" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="avatar-name">{user.name}</div>
            <div className="avatar-role" style={{ color: "#60a5fa" }}>🤝 NGO</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "browse",    icon: "🗺️",  label: "Browse Food" },
            { id: "claimed",   icon: "📋",  label: "My Claims" },
            { id: "history",   icon: "📜",  label: "History" },
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
        <EmailVerifyBanner user={user} />

        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              {getGreeting()}, <span style={{ color: "#60a5fa" }}>{user.name.split(" ")[0]}</span> 🤝
            </h1>
            <p className="dash-subtitle">Discover and claim available food donations nearby</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="🍱" label="Available Near You" value="—"  color="#60a5fa" />
          <StatCard icon="✅" label="Successfully Claimed" value="—" color="#22d3a5" />
          <StatCard icon="🔄" label="In Delivery"          value="—" color="#f97316" />
          <StatCard icon="👥" label="People Served"        value="—" color="#a78bfa" />
        </div>

        {/* Map placeholder */}
        <div className="section-title">Available Donations Map</div>
        <div className="map-placeholder">
          <div className="map-placeholder-inner">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontWeight: 600, color: "var(--clr-text)", marginBottom: 6 }}>Interactive Map</div>
            <div style={{ color: "var(--clr-muted)", fontSize: "0.85rem" }}>
              Leaflet map with real-time donation pins loads here.
              <br />Showing donations within <strong>20 km</strong> of your location.
            </div>
          </div>
        </div>

        {/* Available donations list */}
        <div className="section-title" style={{ marginTop: 24 }}>Nearby Available Food</div>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No donations available right now</div>
          <div className="empty-body">Check back later — restaurants post food regularly</div>
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

export default NgoDashboard;
