import { useState }           from "react";
import "./styles.css";
import { Toaster }             from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ── Auth pages
import LoginPage        from "./pages/LoginPage";
import RegisterPage     from "./pages/RegisterPage";

// ── Role dashboards
import RestaurantDashboard from "./dashboards/RestaurantDashboard";
import NgoDashboard        from "./dashboards/NgoDashboard";
import VolunteerDashboard  from "./dashboards/VolunteerDashboard";
import AdminDashboard      from "./dashboards/AdminDashboard";
import PendingScreen       from "./dashboards/PendingScreen";

// ─── Role → Dashboard map ─────────────────────────────────────────────────────
const ROLE_DASHBOARD = {
  customer:  RestaurantDashboard,
  ngo:       NgoDashboard,
  volunteer: VolunteerDashboard,
  admin:     AdminDashboard,
  employee:  RestaurantDashboard,
};

const ROLE_COLORS = {
  customer:  "#f97316",
  ngo:       "#60a5fa",
  volunteer: "#22d3a5",
  admin:     "#a78bfa",
  employee:  "#fbbf24",
};

// ─── Top Navigation ───────────────────────────────────────────────────────────
const TopNav = ({ user, onLogout, authView, setAuthView }) => {
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try { await onLogout(); } finally { setLogoutLoading(false); }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">🍱</div>
        <span className="navbar-title">ResQFood</span>
      </div>

      <div className="navbar-nav">
        {user ? (
          <>
            <span className="navbar-user-info">
              <span
                className="navbar-role-dot"
                style={{ background: ROLE_COLORS[user.role] ?? "#94a3b8" }}
              />
              Hi, {user.name.split(" ")[0]} 👋
            </span>
            {user.emailVerified && (
              <span className="verified-chip" title="Email verified">✓ Verified</span>
            )}
            <button
              id="btn-logout"
              className="nav-btn nav-btn-danger"
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? "Signing out…" : "Sign Out"}
            </button>
          </>
        ) : (
          <>
            <button
              id="btn-nav-login"
              className={`nav-btn ${authView === "login" ? "active" : ""}`}
              onClick={() => setAuthView("login")}
            >
              Sign In
            </button>
            <button
              id="btn-nav-register"
              className={`nav-btn ${authView === "register" ? "active" : ""}`}
              onClick={() => setAuthView("register")}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

// ─── App Shell ────────────────────────────────────────────────────────────────
const AppShell = () => {
  const { user, isLoggedIn, initialising, logout } = useAuth();
  const [authView, setAuthView] = useState("login");

  // ── Splash screen while restoring session ────────
  if (initialising) {
    return (
      <div className="splash-screen">
        <div className="splash-logo">🍱</div>
        <div className="splash-title">ResQFood</div>
        <div className="splash-subtitle">Connecting surplus food with those in need</div>
        <div className="splash-spinner" />
      </div>
    );
  }

  // ── Logged-in routing ────────────────────────────
  if (isLoggedIn && user) {
    // Customer / NGO pending admin approval
    const needsApproval = ["customer", "ngo"].includes(user.role);
    if (needsApproval && user.approvalStatus === "pending") {
      return (
        <div className="app-root">
          <TopNav user={user} onLogout={logout} />
          <main className="page-container">
            <PendingScreen user={user} onLogout={logout} />
          </main>
        </div>
      );
    }

    const Dashboard = ROLE_DASHBOARD[user.role];
    return (
      <div className="app-root">
        <TopNav user={user} onLogout={logout} />
        <main className="page-container dashboard-container">
          {Dashboard
            ? <Dashboard user={user} onLogout={logout} />
            : <div style={{ color: "var(--clr-muted)" }}>Unknown role: {user.role}</div>
          }
        </main>
      </div>
    );
  }

  // ── Not logged in → auth pages ───────────────────
  return (
    <div className="app-root">
      <TopNav user={null} onLogout={logout} authView={authView} setAuthView={setAuthView} />
      <main className="page-container">
        {authView === "login"
          ? <LoginPage    onSwitch={() => setAuthView("register")} />
          : <RegisterPage onSwitch={() => setAuthView("login")} />
        }
      </main>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <AppShell />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          fontSize: "0.875rem",
        },
        success: { iconTheme: { primary: "#22d3a5", secondary: "#0a0f1e" } },
        error:   { iconTheme: { primary: "#f43f5e", secondary: "#0a0f1e" } },
      }}
    />
  </AuthProvider>
);

export default App;
