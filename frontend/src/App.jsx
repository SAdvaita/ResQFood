import { useState, useEffect } from "react";
import "./styles.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

// roles that are auto-approved
const AUTO_APPROVED_ROLES = ["volunteer"];

const AppShell = () => {
  const { accessToken, user, logout } = useAuth();
  const [view, setView] = useState("login");   // "login" | "register"
  const [logoutLoading, setLogoutLoading] = useState(false);

  // once logged in always show dashboard
  const isLoggedIn = Boolean(accessToken && user);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="app-root">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">🍱</div>
          <span className="navbar-title">ResQFood</span>
        </div>

        <div className="navbar-nav">
          {isLoggedIn ? (
            <>
              <span style={{ fontSize: "0.85rem", color: "var(--clr-muted)", marginRight: 8 }}>
                Hi, {user.name.split(" ")[0]} 👋
              </span>
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
                className={`nav-btn ${view === "login" ? "active" : ""}`}
                onClick={() => setView("login")}
              >
                Sign In
              </button>
              <button
                id="btn-nav-register"
                className={`nav-btn ${view === "register" ? "active" : ""}`}
                onClick={() => setView("register")}
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────── */}
      <main className="page-container">
        {isLoggedIn ? (
          <DashboardPage onLogout={handleLogout} />
        ) : view === "login" ? (
          <LoginPage onSwitch={() => setView("register")} />
        ) : (
          <RegisterPage onSwitch={() => setView("login")} />
        )}
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
