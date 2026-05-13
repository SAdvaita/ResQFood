/**
 * Volunteer Dashboard (role: volunteer)
 * ───────────────────────────────────────
 * Features:
 *  - Available delivery requests (claimed food waiting for volunteer)
 *  - Accept delivery & update status lifecycle
 *  - Active delivery tracker
 *  - Delivery history & stats
 *  - Availability toggle
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../api/client";
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

const STATUS_FLOW = ["assigned", "navigating_pickup", "at_pickup", "picked_up", "in_transit", "delivered"];
const NEXT_STATUS = {
  assigned: "navigating_pickup",
  navigating_pickup: "at_pickup",
  at_pickup: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};
const STATUS_LABELS = {
  assigned: "🚀 Start Navigation",
  navigating_pickup: "📍 Arrived at Pickup",
  at_pickup: "📦 Confirm Pickup",
  picked_up: "🚴 Start Delivery",
  in_transit: "✅ Confirm Delivery",
};
const TIER_COLORS = { bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700" };

const VolunteerDashboard = ({ user, onLogout }) => {
  const [showReset, setShowReset] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [stats, setStats] = useState({});
  const [available, setAvailable] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, availRes, activeRes, histRes] = await Promise.all([
        apiClient.get("/volunteers/stats").catch(() => null),
        apiClient.get("/volunteers/assignments/available").catch(() => null),
        apiClient.get("/volunteers/assignments/active").catch(() => null),
        apiClient.get("/volunteers/assignments/history").catch(() => null),
      ]);
      if (statsRes) setStats(statsRes.data?.data || {});
      if (availRes) setAvailable(availRes.data?.data?.foods || []);
      if (activeRes) setActiveTask(activeRes.data?.data?.assignment || null);
      if (histRes) setHistory(histRes.data?.data?.assignments || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAccept = async (foodId) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/volunteers/assignments/${foodId}/accept`);
      toast.success("Delivery accepted! 🎉");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept");
    } finally { setActionLoading(false); }
  };

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/volunteers/assignments/${assignmentId}/status`, { status: newStatus });
      toast.success(newStatus === "delivered" ? "Delivery complete! 🎉 Points awarded!" : "Status updated!");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally { setActionLoading(false); }
  };

  const handleCancel = async (assignmentId) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/volunteers/assignments/${assignmentId}/status`, { status: "cancelled" });
      toast.success("Delivery cancelled");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    } finally { setActionLoading(false); }
  };

  const handleToggleAvailability = async () => {
    try {
      const res = await apiClient.patch("/volunteers/availability");
      const isOnline = res.data?.data?.isAvailable;
      toast.success(isOnline ? "You're online! 🟢" : "You're offline 🔴");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle");
    }
  };

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
            { id: "available", icon: "📋", label: "Available Pickups" },
            { id: "active",    icon: "🚴", label: "My Active Run" },
            { id: "history",   icon: "📜", label: "Delivery History" },
            { id: "profile",   icon: "👤", label: "Profile" },
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
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              {getGreeting()}, <span style={{ color: "#22d3a5" }}>{user.name.split(" ")[0]}</span> 🚴
            </h1>
            <p className="dash-subtitle">Accept delivery requests and help food reach those in need</p>
          </div>
          <button
            className={`status-indicator ${stats.isAvailable ? "" : "offline"}`}
            onClick={handleToggleAvailability}
            style={{ cursor: "pointer", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 16px", color: "var(--clr-text)" }}
          >
            <span className={`status-dot ${stats.isAvailable ? "active-dot-pulse" : ""}`}
              style={{ background: stats.isAvailable ? "#22d3a5" : "#f43f5e" }} />
            {stats.isAvailable ? "Online" : "Offline"}
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="🚴" label="Total Deliveries" value={stats.totalDeliveries ?? "—"} color="#22d3a5" />
          <StatCard icon="⭐" label="Points"           value={stats.totalPoints ?? "—"}     color="#fbbf24" />
          <StatCard icon="🏅" label="Tier"             value={stats.tier ? stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1) : "—"}
            color={TIER_COLORS[stats.tier] || "#94a3b8"} />
          <StatCard icon="🔥" label="Streak"           value={stats.currentStreak ?? "—"}   color="#f97316" />
        </div>

        {/* Available Pickups */}
        {activeTab === "available" && (
          <>
            <div className="section-title">
              Available Pickups
              {available.length > 0 && <span className="section-badge">{available.length}</span>}
            </div>
            {loading ? (
              <div className="loading-row"><div className="btn-spinner" style={{ borderTopColor: "#22d3a5", width: 20, height: 20 }} /> Loading…</div>
            ) : available.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-title">No deliveries available</div>
                <div className="empty-body">Deliveries appear here once an NGO claims a donation.</div></div>
            ) : (
              <div className="donations-list">{available.map((f) => (
                <div key={f._id} className="donation-item">
                  <div className="donation-item-header">
                    <div>
                      <div className="donation-item-name">{f.foodName}</div>
                      <div className="donation-item-meta">
                        <span className="food-type-chip">{f.category}</span>
                        <span>📦 {f.quantity} {f.unit}</span>
                        <span style={{ color: "var(--clr-muted)", fontSize: "0.8rem" }}>📍 {f.pickupAddress}</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn-accent" style={{ marginTop: 8 }} onClick={() => handleAccept(f._id)} disabled={actionLoading || stats.hasActiveTask}>
                    {stats.hasActiveTask ? "Complete current run first" : "🚴 Accept Delivery"}
                  </button>
                </div>
              ))}</div>
            )}
          </>
        )}

        {/* Active Delivery */}
        {activeTab === "active" && (
          <>
            <div className="section-title">My Active Delivery</div>
            {!activeTask ? (
              <div className="empty-state"><div className="empty-icon">🔄</div><div className="empty-title">No active delivery</div>
                <div className="empty-body">Accept a request from the Available Pickups tab.</div></div>
            ) : (
              <div className="donation-item" style={{ borderLeft: "3px solid #22d3a5" }}>
                <div className="donation-item-header">
                  <div>
                    <div className="donation-item-name">{activeTask.foodId?.foodName || "Food"}</div>
                    <div className="donation-item-meta">
                      <span className="food-type-chip">{activeTask.foodId?.category}</span>
                      <span>📦 {activeTask.foodId?.quantity} {activeTask.foodId?.unit}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)", marginTop: 8 }}>
                      📍 Pickup: {activeTask.foodId?.pickupAddress || "—"}
                    </div>
                  </div>
                  <span className="status-chip" style={{ background: "#22d3a518", color: "#22d3a5" }}>
                    {activeTask.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Status Progress */}
                <div style={{ display: "flex", gap: 4, margin: "16px 0 12px" }}>
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: STATUS_FLOW.indexOf(activeTask.status) >= i ? "#22d3a5" : "rgba(255,255,255,0.1)",
                    }} />
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {NEXT_STATUS[activeTask.status] && (
                    <button className="btn-accent" onClick={() => handleStatusUpdate(activeTask._id, NEXT_STATUS[activeTask.status])}
                      disabled={actionLoading}>
                      {STATUS_LABELS[activeTask.status]}
                    </button>
                  )}
                  {activeTask.status !== "delivered" && (
                    <button className="btn-reject" onClick={() => handleCancel(activeTask._id)} disabled={actionLoading}>
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* History */}
        {activeTab === "history" && (
          <>
            <div className="section-title">Delivery History</div>
            {history.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📜</div><div className="empty-title">No deliveries yet</div></div>
            ) : (
              <div className="donations-list">{history.map((a) => (
                <div key={a._id} className="donation-item">
                  <div className="donation-item-header">
                    <div>
                      <div className="donation-item-name">{a.foodId?.foodName || "Food"}</div>
                      <div className="donation-item-meta">
                        <span className="food-type-chip">{a.foodId?.category}</span>
                        <span>{a.foodId?.quantity} {a.foodId?.unit}</span>
                      </div>
                    </div>
                    <span className="status-chip" style={{
                      background: a.status === "delivered" ? "#22d3a518" : "#f43f5e18",
                      color: a.status === "delivered" ? "#22d3a5" : "#f43f5e",
                    }}>{a.status}</span>
                  </div>
                </div>
              ))}</div>
            )}
          </>
        )}

        {/* Profile */}
        {activeTab === "profile" && (
          <>
            <div className="section-title">Profile</div>
            <div className="pending-info-boxes">
              <div className="pending-info-box"><div className="pib-label">Name</div><div className="pib-value">{user.name}</div></div>
              <div className="pending-info-box"><div className="pib-label">Tier</div>
                <div className="pib-value" style={{ color: TIER_COLORS[stats.tier] }}>{stats.tier ? stats.tier.toUpperCase() : "—"}</div></div>
              <div className="pending-info-box"><div className="pib-label">Points</div><div className="pib-value">{stats.totalPoints ?? 0}</div></div>
              <div className="pending-info-box"><div className="pib-label">Deliveries</div><div className="pib-value">{stats.totalDeliveries ?? 0}</div></div>
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

export default VolunteerDashboard;
