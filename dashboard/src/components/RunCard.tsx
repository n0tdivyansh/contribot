import { useNavigate } from "react-router-dom";
import type { RunSummary } from "../types";

interface Props {
  run: RunSummary;
  delay?: number;
}

function timeAgo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function fmtDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function modeBadge(mode: RunSummary["mode"]) {
  const cls = `badge badge-mode-${mode}`;
  const label = mode === "scan" ? "📡 scan" : mode === "fix" ? "🔧 fix" : "▶️ run";
  return <span className={cls}>{label}</span>;
}

export function RunCard({ run, delay = 0 }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="run-card"
      style={{ animationDelay: `${delay}s` }}
      onClick={() => navigate(`/runs/${run.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/runs/${run.id}`)}
    >
      <div className="run-card-left">
        <div className="run-card-top">
          {modeBadge(run.mode)}
          <span className="run-card-repo mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {run.id}
          </span>
          {run.publish && (
            <span className="badge badge-primary">🔀 publish</span>
          )}
        </div>
        <div className="run-card-meta">
          <span>🕐 {timeAgo(run.startedAt)}</span>
          <span>·</span>
          <span>⏱ {fmtDuration(run.durationMs)}</span>
          {run.totalRepos > 0 && (
            <>
              <span>·</span>
              <span>{run.totalRepos} repo{run.totalRepos !== 1 ? "s" : ""}</span>
            </>
          )}
          {run.prsOpened > 0 && (
            <>
              <span>·</span>
              <span className="text-primary-accent">🔀 {run.prsOpened} PR{run.prsOpened !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>

      <div className="run-card-right">
        <div className="run-card-results">
          {run.success > 0 && <span className="mini-count s">✓ {run.success}</span>}
          {run.failed > 0  && <span className="mini-count f">✗ {run.failed}</span>}
          {run.skipped > 0 && <span className="mini-count k">— {run.skipped}</span>}
          {run.totalRepos === 0 && <span className="mini-count">no results</span>}
        </div>
        <svg style={{ color: "var(--text-muted)", width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}
