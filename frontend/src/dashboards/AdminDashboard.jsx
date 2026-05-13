/**
 * Admin Dashboard (role: admin)
 * ──────────────────────────────
 * Features:
 *  - Platform-wide stats
 *  - User approval queue (approve / reject)
 *  - All donations table
 *  - All users management
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../api/client";

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderColor: `${color}22` }}>
    <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const PendingUserRow = ({ user, onAction }) => {
  const [loading, setLoading] = useState(false);
  const handle = async (action) => {
    setLoading(true);
    try { await onAction(user._id ?? user.id, action); } finally { setLoading(false); }
  };
  const ROLE_ICONS = { customer: "🍽️", ngo: "🤝", volunteer: "🚴" };
  return (
    <div className="pending-user-row">
      <div className="pur-avatar">{(user.name ?? "U").charAt(0).toUpperCase()}</div>
      <div className="pur-info">
        <div className="pur-name">{user.name}</div>
        <div className="pur-meta">
          <span className="food-type-chip">{ROLE_ICONS[user.role] ?? "👤"} {user.role}</span>
          <span style={{ color: "var(--clr-muted)", fontSize: "0.8rem" }}>{user.email}</span>
        </div>
      </div>
      <div className="pur-actions">
        <button className="btn-approve" onClick={() => handle("approved")} disabled={loading}>✓ Approve</button>
        <button className="btn-reject" onClick={() => handle("rejected")} disabled={loading}>✕ Reject</button>
      </div>
    </div>
  );
};

const STATUS_COLORS = {
  available: "#60a5fa", accepted: "#fbbf24", assigned: "#f97316",
  picked_up: "#a78bfa", in_transit: "#8b5cf6", delivered: "#22d3a5",
  expired: "#94a3b8", cancelled: "#f43f5e",
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab,     setActiveTab]     = useState("overview");
  const [pendingUsers,  setPendingUsers]  = useState([]);
  const [allUsers,      setAllUsers]      = useState([]);
  const [donations,     setDonations]     = useState([]);
  const [loadingUsers,  setLoadingUsers]  = useState(false);
  const [stats,         setStats]         = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true);
      try {
        const [pendingRes, statsRes, usersRes, donationsRes] = await Promise.all([
          apiClient.get("/governance/users/pending"),
          apiClient.get("/governance/stats").catch(() => null),
          apiClient.get("/governance/users?limit=50").catch(() => null),
          apiClient.get("/governance/donations?limit=50").catch(() => null),
        ]);
        setPendingUsers(pendingRes.data?.data?.users ?? []);
        if (statsRes) setStats(statsRes.data?.data ?? null);
        if (usersRes) setAllUsers(usersRes.data?.data?.users ?? []);
        if (donationsRes) setDonations(donationsRes.data?.data?.foods ?? []);
      } catch {
        setPendingUsers([]);
      } finally { setLoadingUsers(false); }
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

  const handleToggleActive = async (userId) => {
    try {
      const res = await apiClient.patch(`/governance/users/${userId}/toggle-active`);
      const isActive = res.data?.data?.isActive;
      setAllUsers((prev) => prev.map((u) => ((u._id ?? u.id) === userId ? { ...u, isActive } : u)));
      toast.success(`Account ${isActive ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "approvals":
        return (
          <>
            <div className="section-title">
              Pending Approvals
              {pendingUsers.length > 0 && <span className="section-badge urgent">{pendingUsers.length}</span>}
            </div>
            {loadingUsers ? (
              <div className="loading-row"><div className="btn-spinner" style={{ borderTopColor: "#a78bfa", width: 20, height: 20 }} /> Loading…</div>
            ) : pendingUsers.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-title">All caught up!</div></div>
            ) : (
              <div className="pending-users-list">{pendingUsers.map((u) => (
                <PendingUserRow key={u._id ?? u.id} user={u} onAction={handleApproval} />
              ))}</div>
            )}
          </>
        );

      case "users":
        return (
          <>
            <div className="section-title">All Users ({allUsers.length})</div>
            <div className="donations-list">{allUsers.map((u) => (
              <div key={u._id} className="donation-item">
                <div className="donation-item-header">
                  <div>
                    <div className="donation-item-name">{u.name}</div>
                    <div className="donation-item-meta">
                      <span className="food-type-chip">{u.role}</span>
                      <span style={{ color: "var(--clr-muted)", fontSize: "0.8rem" }}>{u.email}</span>
                      <span className="status-chip" style={{
                        background: u.approvalStatus === "approved" ? "#22d3a518" : u.approvalStatus === "rejected" ? "#f43f5e18" : "#fbbf2418",
                        color: u.approvalStatus === "approved" ? "#22d3a5" : u.approvalStatus === "rejected" ? "#f43f5e" : "#fbbf24",
                      }}>{u.approvalStatus}</span>
                    </div>
                  </div>
                  {u.role !== "admin" && (
                    <button className={u.isActive ? "btn-reject" : "btn-approve"} style={{ fontSize: "0.8rem" }}
                      onClick={() => handleToggleActive(u._id)}>
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                  )}
                </div>
              </div>
            ))}</div>
          </>
        );

      case "donations":
        return (
          <>
            <div className="section-title">All Donations ({donations.length})</div>
            {donations.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">No donations yet</div></div>
            ) : (
              <div className="donations-list">{donations.map((f) => (
                <div key={f._id} className="donation-item">
                  <div className="donation-item-header">
                    <div>
                      <div className="donation-item-name">{f.foodName}</div>
                      <div className="donation-item-meta">
                        <span className="food-type-chip">{f.category}</span>
                        <span>{f.quantity} {f.unit}</span>
                        <span style={{ color: "var(--clr-muted)", fontSize: "0.8rem" }}>by {f.customerId?.name || "—"}</span>
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
        );

      default: // overview
        return (
          <>
            <div className="section-title">
              Pending Approvals
              {pendingUsers.length > 0 && <span className="section-badge urgent">{pendingUsers.length}</span>}
            </div>
            {pendingUsers.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-title">All caught up!</div></div>
            ) : (
              <div className="pending-users-list">{pendingUsers.slice(0, 5).map((u) => (
                <PendingUserRow key={u._id ?? u.id} user={u} onAction={handleApproval} />
              ))}</div>
            )}
          </>
        );
    }
  };

  return (
    <div className="dashboard-layout">
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
            { id: "overview",  icon: "📊", label: "Overview" },
            { id: "approvals", icon: "✅", label: `Approvals ${pendingUsers.length ? `(${pendingUsers.length})` : ""}` },
            { id: "users",     icon: "👥", label: "All Users" },
            { id: "donations", icon: "📦", label: "Donations" },
          ].map((item) => (
            <button key={item.id} className={`sidebar-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={onLogout}>🚪 Sign Out</button>
      </aside>

      <div className="dashboard-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Admin <span style={{ color: "#a78bfa" }}>Control Panel</span> 🛡️</h1>
            <p className="dash-subtitle">Manage users, donations, and platform operations</p>
          </div>
          {pendingUsers.length > 0 && (
            <div className="alert-chip">⚠️ {pendingUsers.length} pending approval{pendingUsers.length > 1 ? "s" : ""}</div>
          )}
        </div>

        <div className="stats-grid">
          <StatCard icon="👥" label="Total Users"      value={stats?.users?.total ?? "—"}      color="#a78bfa" />
          <StatCard icon="📦" label="Total Donations"  value={stats?.donations?.total ?? "—"}  color="#f97316" />
          <StatCard icon="✅" label="Delivered"         value={stats?.donations?.delivered ?? "—"} color="#22d3a5" />
          <StatCard icon="⏳" label="Pending Approval"  value={pendingUsers.length}             color="#fbbf24" />
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
