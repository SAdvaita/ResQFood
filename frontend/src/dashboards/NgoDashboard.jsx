/**
 * NGO Dashboard (role: ngo)
 * ──────────────────────────
 * Features:
 *  - Browse available food donations
 *  - Claim food listings
 *  - View my claims with status
 *  - Stats overview
 *  - Email verification banner
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../api/client";
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

const CATEGORY_ICONS = {
  rice: "🍚", meat: "🍖", vegetables: "🥬", dairy: "🧀",
  bread: "🍞", snacks: "🍪", beverage: "🥤", other: "🍽️",
};

const STATUS_COLORS = {
  available: "#60a5fa", accepted: "#fbbf24", assigned: "#f97316",
  picked_up: "#a78bfa", in_transit: "#8b5cf6", delivered: "#22d3a5",
  expired: "#94a3b8", cancelled: "#f43f5e",
};

// ─── Available Food Card ──────────────────────────────────────────────────────
const FoodCard = ({ food, onClaim, claiming }) => (
  <div className="donation-item">
    <div className="donation-item-header">
      <div>
        <div className="donation-item-name">{food.foodName}</div>
        <div className="donation-item-meta">
          <span className="food-type-chip">{CATEGORY_ICONS[food.category] || "🍽️"} {food.category}</span>
          <span>📦 {food.quantity} {food.unit}</span>
          {food.urgencyLevel && (
            <span className="food-type-chip" style={{
              color: food.urgencyLevel === "critical" ? "#f43f5e" : food.urgencyLevel === "high" ? "#f97316" : "#60a5fa",
            }}>⚡ {food.urgencyLevel}</span>
          )}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)", marginTop: 4 }}>
          📍 {food.pickupAddress || "—"} · 👤 {food.customerId?.name || "Unknown"}
        </div>
      </div>
    </div>
    <button className="btn-accent" style={{ marginTop: 8 }} onClick={() => onClaim(food._id)} disabled={claiming}>
      {claiming ? "Claiming…" : "🤝 Claim Food"}
    </button>
  </div>
);

const NgoDashboard = ({ user, onLogout }) => {
  const [showReset, setShowReset] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [stats, setStats] = useState({ claimed: 0, delivered: 0, inDelivery: 0, availableNearby: 0 });
  const [available, setAvailable] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, availRes, claimsRes] = await Promise.all([
        apiClient.get("/ngo/stats").catch(() => null),
        apiClient.get("/ngo/food/available").catch(() => null),
        apiClient.get("/ngo/claims").catch(() => null),
      ]);
      if (statsRes) setStats(statsRes.data?.data || {});
      if (availRes) setAvailable(availRes.data?.data?.foods || []);
      if (claimsRes) setClaims(claimsRes.data?.data?.foods || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleClaim = async (foodId) => {
    setClaiming(true);
    try {
      await apiClient.post(`/ngo/food/${foodId}/claim`);
      toast.success("Food claimed! A volunteer will be assigned shortly. 🎉");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim food");
    } finally { setClaiming(false); }
  };

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
            { id: "browse",  icon: "🗺️", label: "Browse Food" },
            { id: "claimed", icon: "📋", label: "My Claims" },
            { id: "profile", icon: "👤", label: "Profile" },
          ].map((item) => (
            <button key={item.id} className={`sidebar-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}>
              <span>{item.icon}</span>{item.label}
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
          <StatCard icon="🍱" label="Available Near You"   value={stats.availableNearby} color="#60a5fa" />
          <StatCard icon="✅" label="Successfully Claimed" value={stats.claimed}          color="#22d3a5" />
          <StatCard icon="🚴" label="In Delivery"          value={stats.inDelivery}       color="#f97316" />
          <StatCard icon="📦" label="Delivered"            value={stats.delivered}         color="#a78bfa" />
        </div>

        {/* Browse tab */}
        {activeTab === "browse" && (
          <>
            <div className="section-title">
              Available Food
              {available.length > 0 && <span className="section-badge">{available.length} available</span>}
            </div>
            {loading ? (
              <div className="loading-row"><div className="btn-spinner" style={{ borderTopColor: "#60a5fa", width: 20, height: 20 }} /> Loading…</div>
            ) : available.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">No donations available right now</div>
                <div className="empty-body">Check back later — restaurants post food regularly</div>
              </div>
            ) : (
              <div className="donations-list">{available.map((f) => (
                <FoodCard key={f._id} food={f} onClaim={handleClaim} claiming={claiming} />
              ))}</div>
            )}
          </>
        )}

        {/* Claims tab */}
        {activeTab === "claimed" && (
          <>
            <div className="section-title">My Claims</div>
            {claims.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No claims yet</div></div>
            ) : (
              <div className="donations-list">{claims.map((f) => (
                <div key={f._id} className="donation-item">
                  <div className="donation-item-header">
                    <div>
                      <div className="donation-item-name">{f.foodName}</div>
                      <div className="donation-item-meta">
                        <span className="food-type-chip">{f.category}</span>
                        <span>{f.quantity} {f.unit}</span>
                      </div>
                    </div>
                    <span className="status-chip" style={{ background: `${STATUS_COLORS[f.status]}18`, color: STATUS_COLORS[f.status] }}>
                      {f.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}</div>
            )}
          </>
        )}

        {/* Profile tab */}
        {activeTab === "profile" && (
          <>
            <div className="section-title">Profile</div>
            <div className="pending-info-boxes">
              <div className="pending-info-box"><div className="pib-label">Name</div><div className="pib-value">{user.name}</div></div>
              <div className="pending-info-box"><div className="pib-label">Email</div><div className="pib-value">{user.email || "—"}</div></div>
              <div className="pending-info-box"><div className="pib-label">Phone</div><div className="pib-value">{user.phone || "—"}</div></div>
            </div>
            <button className="reset-link" style={{ marginTop: 16 }} onClick={() => setShowReset(true)}>🔑 Reset Password</button>
          </>
        )}
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
