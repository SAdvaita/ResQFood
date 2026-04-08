/**
 * Admin Dashboard (role: admin)
 * ──────────────────────────────
 * Features:
 *  - Platform-wide stats
 *  - User approval queue (approve / reject Restaurant & NGO)
 *  - All donations table
 *  - User management
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../api/client";

const StatCard = ({ icon, label, value, color, delta }) => (
  <div className="stat-card" style={{ borderColor: `${color}22` }}>
    <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {delta && <div className="stat-delta">{delta}</div>}
    </div>
  </div>
);

const PendingUserRow = ({ user, onAction }) => {
  const [loading, setLoading] = useState(false);

  const handle = async (action) => {
    setLoading(true);
    try {
      await onAction(user._id ?? user.id, action);
    } finally {
      setLoading(false);
    }
  };

  const ROLE_ICONS = { customer: "🍽️", ngo: "🤝", volunteer: "🚴" };

  return (
    <div className="pending-user-row">
      <div className="pur-avatar">
        {(user.name ?? "U").charAt(0).toUpperCase()}
      </div>
      <div className="pur-info">
        <div className="pur-name">{user.name}</div>
        <div className="pur-meta">
          <span className="food-type-chip">
            {ROLE_ICONS[user.role] ?? "👤"} {user.role}
          </span>
          <span style={{ color: "var(--clr-muted)", fontSize: "0.8rem" }}>{user.email}</span>
        </div>
      </div>
      <div className="pur-actions">
        <button
          className="btn-approve"
          onClick={() => handle("approved")}
          disabled={loading}
        >✓ Approve</button>
        <button
          className="btn-reject"
          onClick={() => handle("rejected")}
          disabled={loading}
        >✕ Reject</button>
      </div>
    </div>
  );
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab,     setActiveTab]     = useState("overview");
  const [pendingUsers,  setPendingUsers]  = useState([]);
  const [loadingUsers,  setLoadingUsers]  = useState(false);
  const [stats,         setStats]         = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true);
      try {
        const [pendingRes, statsRes] = await Promise.all([
          apiClient.get("/governance/users/pending"),
          apiClient.get("/governance/stats").catch(() => null),
        ]);
        setPendingUsers(pendingRes.data?.data?.users ?? []);
        if (statsRes) setStats(statsRes.data?.data ?? null);
      } catch {
        setPendingUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, []);

  const handleApproval = async (userId, action) => {
    try {
      await apiClient.patch(`/governance/users/${userId}/approve`, { action });
      setPendingUsers((prev) => prev.filter((u) => (u._id ?? u.id) !== userId));
      toast.success(`User ${action}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-avatar">
          <div className="avatar-circle" style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="avatar-name">{user.name}</div>
            <div className="avatar-role" style={{ color: "#a78bfa" }}>🛡️ Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "overview",  icon: "📊",  label: "Overview" },
            { id: "approvals", icon: "✅",  label: `Approvals ${pendingUsers.length ? `(${pendingUsers.length})` : ""}` },
            { id: "users",     icon: "👥",  label: "All Users" },
            { id: "donations", icon: "📦",  label: "Donations" },
            { id: "analytics", icon: "📈",  label: "Analytics" },
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
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              Admin <span style={{ color: "#a78bfa" }}>Control Panel</span> 🛡️
            </h1>
            <p className="dash-subtitle">Manage users, donations, and platform operations</p>
          </div>
          {pendingUsers.length > 0 && (
            <div className="alert-chip">
              ⚠️ {pendingUsers.length} pending approval{pendingUsers.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Platform stats */}
        <div className="stats-grid">
          <StatCard icon="👥"  label="Total Users"      value={stats?.users?.total     ?? "—"}  color="#a78bfa" />
          <StatCard icon="📦"  label="Total Donations"  value={stats?.donations?.total  ?? "—"}  color="#f97316" />
          <StatCard icon="✅"  label="Delivered"         value={stats?.donations?.delivered ?? "—"}  color="#22d3a5" />
          <StatCard icon="⏳"  label="Pending Approval"  value={pendingUsers.length}    color="#fbbf24" />
        </div>

        {/* Approval Queue */}
        <div className="section-title">
          Pending Approvals
          {pendingUsers.length > 0 && (
            <span className="section-badge urgent">{pendingUsers.length}</span>
          )}
        </div>

        {loadingUsers ? (
          <div className="loading-row">
            <div className="btn-spinner" style={{ borderTopColor: "#a78bfa", width: 20, height: 20 }} />
            Loading pending users…
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">All caught up!</div>
            <div className="empty-body">No users pending approval right now</div>
          </div>
        ) : (
          <div className="pending-users-list">
            {pendingUsers.map((u) => (
              <PendingUserRow
                key={u._id ?? u.id}
                user={u}
                onAction={handleApproval}
              />
            ))}
          </div>
        )}

        {/* All Donations placeholder */}
        <div className="section-title" style={{ marginTop: 32 }}>Recent Donations</div>
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">Donation table loads here</div>
          <div className="empty-body">Full table with filtering and export will be shown once governance API is connected</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
