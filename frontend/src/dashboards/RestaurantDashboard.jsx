/**
 * Restaurant Dashboard (role: customer / employee)
 * ─────────────────────────────────────────────────
 * Features:
 *  - Stats overview (total donations, active, delivered)
 *  - Email verification banner
 *  - Create food listing form
 *  - My donations list with status
 *  - Quick-access action cards
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

const STATUS_COLORS = {
  available: "#60a5fa", accepted: "#fbbf24", assigned: "#f97316",
  picked_up: "#a78bfa", in_transit: "#8b5cf6", delivered: "#22d3a5",
  expired: "#94a3b8", cancelled: "#f43f5e",
};

const CATEGORIES = ["rice", "meat", "vegetables", "dairy", "bread", "snacks", "beverage", "other"];

// ─── Food Form ────────────────────────────────────────────────────────────────
const FoodForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    foodName: "", category: "rice", quantity: "", unit: "kg",
    description: "", pickupAddress: "", preparedAt: "", expiresAt: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.foodName || !form.quantity || !form.preparedAt || !form.expiresAt || !form.pickupAddress) {
      return toast.error("Please fill all required fields");
    }
    setLoading(true);
    try {
      await apiClient.post("/customer/food", { ...form, quantity: Number(form.quantity) });
      toast.success("Food listed successfully! 🎉");
      setForm({ foodName: "", category: "rice", quantity: "", unit: "kg", description: "", pickupAddress: "", preparedAt: "", expiresAt: "" });
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to list food");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="food-form">
      <div className="form-row">
        <div className="form-group"><label className="form-label">Food Name *</label>
          <input className="form-input" value={form.foodName} onChange={set("foodName")} placeholder="e.g. Biryani, Dal Rice" /></div>
        <div className="form-group"><label className="form-label">Category *</label>
          <select className="form-input" value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Quantity *</label>
          <input className="form-input" type="number" value={form.quantity} onChange={set("quantity")} placeholder="e.g. 10" /></div>
        <div className="form-group"><label className="form-label">Unit</label>
          <select className="form-input" value={form.unit} onChange={set("unit")}>
            {["kg", "litres", "portions", "boxes"].map((u) => <option key={u} value={u}>{u}</option>)}
          </select></div>
      </div>
      <div className="form-group"><label className="form-label">Description</label>
        <input className="form-input" value={form.description} onChange={set("description")} placeholder="Optional details" /></div>
      <div className="form-group"><label className="form-label">Pickup Address *</label>
        <input className="form-input" value={form.pickupAddress} onChange={set("pickupAddress")} placeholder="Full address" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Prepared At *</label>
          <input className="form-input" type="datetime-local" value={form.preparedAt} onChange={set("preparedAt")} /></div>
        <div className="form-group"><label className="form-label">Expires At *</label>
          <input className="form-input" type="datetime-local" value={form.expiresAt} onChange={set("expiresAt")} /></div>
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading && <span className="btn-spinner" />}{loading ? "Listing…" : "🍱 List Food"}
      </button>
    </form>
  );
};

// ─── My Donations List ────────────────────────────────────────────────────────
const DonationsList = ({ foods, onCancel }) => {
  if (!foods.length) return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <div className="empty-title">No donations yet</div>
      <div className="empty-body">Start by listing surplus food using the form above</div>
    </div>
  );

  return (
    <div className="donations-list">
      {foods.map((f) => (
        <div key={f._id} className="donation-item">
          <div className="donation-item-header">
            <div>
              <div className="donation-item-name">{f.foodName}</div>
              <div className="donation-item-meta">
                <span className="food-type-chip">{f.category}</span>
                <span>{f.quantity} {f.unit}</span>
                <span style={{ color: "var(--clr-muted)", fontSize: "0.8rem" }}>{f.pickupAddress}</span>
              </div>
            </div>
            <span className="status-chip" style={{ background: `${STATUS_COLORS[f.status] || "#94a3b8"}18`, color: STATUS_COLORS[f.status] || "#94a3b8" }}>
              {f.status.replace(/_/g, " ")}
            </span>
          </div>
          {f.status === "available" && (
            <button className="btn-reject" style={{ marginTop: 8, fontSize: "0.8rem" }} onClick={() => onCancel(f._id)}>Cancel</button>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const RestaurantDashboard = ({ user, onLogout }) => {
  const [showReset, setShowReset] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ total: 0, available: 0, delivered: 0, inProgress: 0 });
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, foodsRes] = await Promise.all([
        apiClient.get("/customer/stats").catch(() => null),
        apiClient.get("/customer/food").catch(() => null),
      ]);
      if (statsRes) setStats(statsRes.data?.data || {});
      if (foodsRes) setFoods(foodsRes.data?.data?.foods || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCancel = async (foodId) => {
    try {
      await apiClient.patch(`/customer/food/${foodId}/cancel`);
      toast.success("Food listing cancelled");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

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

        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              {getGreeting()}, <span style={{ color: "#f97316" }}>{user.name.split(" ")[0]}</span> 🍽️
            </h1>
            <p className="dash-subtitle">Help fight food waste by listing surplus food</p>
          </div>
          <button className="btn-accent" onClick={() => setActiveTab("donate")}>➕ List Food</button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📦" label="Total Donations" value={stats.total}    color="#f97316" />
          <StatCard icon="✅" label="Delivered"       value={stats.delivered}  color="#22d3a5" />
          <StatCard icon="🔄" label="In Progress"     value={stats.inProgress} color="#60a5fa" />
          <StatCard icon="📢" label="Available"       value={stats.available}  color="#a78bfa" />
        </div>

        {/* Tab Content */}
        {activeTab === "donate" && (
          <>
            <div className="section-title">List Surplus Food</div>
            <FoodForm onCreated={loadData} />
          </>
        )}

        {(activeTab === "overview" || activeTab === "mydonations") && (
          <>
            <div className="section-title" style={{ marginTop: 24 }}>
              {activeTab === "overview" ? "Recent Donations" : "My Donations"}
            </div>
            {loading ? (
              <div className="loading-row">
                <div className="btn-spinner" style={{ borderTopColor: "#f97316", width: 20, height: 20 }} />
                Loading…
              </div>
            ) : (
              <DonationsList foods={foods} onCancel={handleCancel} />
            )}
          </>
        )}

        {activeTab === "profile" && (
          <>
            <div className="section-title">Profile</div>
            <div className="pending-info-boxes">
              <div className="pending-info-box"><div className="pib-label">Name</div><div className="pib-value">{user.name}</div></div>
              <div className="pending-info-box"><div className="pib-label">Email</div><div className="pib-value">{user.email || "—"}</div></div>
              <div className="pending-info-box"><div className="pib-label">Phone</div><div className="pib-value">{user.phone || "—"}</div></div>
              <div className="pending-info-box"><div className="pib-label">Role</div><div className="pib-value" style={{ color: "#f97316" }}>🍽️ {user.role}</div></div>
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

export default RestaurantDashboard;
