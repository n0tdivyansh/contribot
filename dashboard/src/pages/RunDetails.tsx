import { useParams, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useApi";
import { ActivityFeed } from "../components/ActivityFeed";
import { RepoCard } from "../components/RepoCard";
import type { RunLog } from "../types";

function fmtDuration(start: string, end?: string): string {
  if (!end) return "In progress…";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export function RunDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: run, loading, error } = useFetch<RunLog>(`/api/runs/${id ?? ""}`, 15_000);

  if (loading && !run) {
    return (
      <div className="fade-in">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="loader"><div className="spinner" /><div>Loading run details…</div></div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="fade-in">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="error-banner">⚠️ {error ?? "Run not found."}</div>
      </div>
    );
  }

  const successCount = run.results.filter((r) => r.status === "success").length;
  const failedCount  = run.results.filter((r) => r.status === "failed").length;
  const skippedCount = run.results.filter((r) => r.status === "skipped").length;
  const prsCount     = run.results.filter((r) => r.prUrl).length;

  const totalInsertions = run.results.reduce((s, r) => s + (r.validation?.diffStats?.insertions ?? 0), 0);
  const totalDeletions  = run.results.reduce((s, r) => s + (r.validation?.diffStats?.deletions ?? 0), 0);
  const totalFiles      = run.results.reduce((s, r) => s + (r.validation?.diffStats?.filesChanged ?? 0), 0);

  return (
    <div className="fade-in">
      {/* Back */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← All Runs
      </button>

      {/* Run header */}
      <div className="run-detail-header">
        <div className="run-detail-title">
          <span className={`badge badge-mode-${run.mode}`} style={{ fontSize: 13 }}>{run.mode}</span>
          <span className="mono" style={{ fontSize: 18 }}>{run.id}</span>
          {run.publish && <span className="badge badge-primary">🔀 published</span>}
        </div>

        <div className="run-detail-meta">
          <div className="run-detail-meta-item">
            <span className="run-detail-meta-label">Started</span>
            <span className="run-detail-meta-value">{new Date(run.startedAt).toLocaleString()}</span>
          </div>
          {run.finishedAt && (
            <div className="run-detail-meta-item">
              <span className="run-detail-meta-label">Finished</span>
              <span className="run-detail-meta-value">{new Date(run.finishedAt).toLocaleString()}</span>
            </div>
          )}
          <div className="run-detail-meta-item">
            <span className="run-detail-meta-label">Duration</span>
            <span className="run-detail-meta-value">{fmtDuration(run.startedAt, run.finishedAt)}</span>
          </div>
          <div className="run-detail-meta-item">
            <span className="run-detail-meta-label">Repos</span>
            <span className="run-detail-meta-value">{run.results.length}</span>
          </div>
          <div className="run-detail-meta-item">
            <span className="run-detail-meta-label">Events</span>
            <span className="run-detail-meta-value">{run.events.length}</span>
          </div>
        </div>

        {/* Summary pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {successCount > 0 && <span className="badge badge-success">✓ {successCount} success</span>}
          {failedCount  > 0 && <span className="badge badge-failed">✗ {failedCount} failed</span>}
          {skippedCount > 0 && <span className="badge badge-skipped">— {skippedCount} skipped</span>}
          {prsCount     > 0 && <span className="badge badge-primary">🔀 {prsCount} PR{prsCount !== 1 ? "s" : ""} opened</span>}
        </div>

        {/* Aggregate diff */}
        {(totalFiles > 0) && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: "var(--r-md)" }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Total Changes</div>
            <div className="diff-stats-row">
              <span className="diff-stat files">📁 {totalFiles} files</span>
              <span className="diff-stat ins">+{totalInsertions} insertions</span>
              <span className="diff-stat del">−{totalDeletions} deletions</span>
            </div>
          </div>
        )}
      </div>

      {/* Repo results + Activity */}
      <div className="section-grid">
        {/* Repo result cards */}
        <div>
          <div className="section-label">Repository Results ({run.results.length})</div>
          {run.results.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <div className="empty-state-icon">📭</div>
              <h3>No results</h3>
              <p>This run produced no repository results.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {run.results.map((result, i) => (
                <RepoCard key={result.repo + i} result={result} delay={i * 0.05} />
              ))}
            </div>
          )}
        </div>

        {/* Event timeline */}
        <div>
          <div className="section-label">Event Log ({run.events.length})</div>
          <div className="card">
            <div className="card-body" style={{ padding: "8px 16px", maxHeight: 600, overflowY: "auto" }}>
              <ActivityFeed events={run.events} maxItems={100} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
