import { NavLink } from "react-router-dom";
import { useServerHealth } from "../hooks/useApi";

export function Sidebar() {
  const health = useServerHealth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🤖</div>
        <div>
          <div className="sidebar-logo-text">Contribot</div>
          <div className="sidebar-logo-sub">Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Monitor</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Overview
        </NavLink>

        <NavLink
          to="/runs"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          All Runs
        </NavLink>

        <div className="nav-section-label">Resources</div>

        <a
          href="https://github.com/n0tdivyansh/contribot"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
        >
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          GitHub
        </a>

        <a
          href="https://github.com/n0tdivyansh/contribot/blob/main/README.md"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
        >
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          Docs
        </a>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="server-status">
          <span className={`status-dot ${health}`} />
          <span>
            API {health === "loading" ? "connecting…" : health === "online" ? "connected" : "offline"}
          </span>
        </div>
        <div className="server-status" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
          Auto-refresh: 10s
        </div>
      </div>
    </aside>
  );
}
