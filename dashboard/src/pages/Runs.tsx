import { useState } from "react";
import { useFetch } from "../hooks/useApi";
import { RunCard } from "../components/RunCard";
import type { RunSummary, RunMode } from "../types";

type FilterMode = RunMode | "all";
type FilterStatus = "all" | "success" | "failed" | "skipped" | "prs";

export function Runs() {
  const { data, loading, error } = useFetch<RunSummary[]>("/api/runs");
  const [modeFilter, setModeFilter] = useState<FilterMode>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const filtered = (data ?? []).filter((run) => {
    if (modeFilter !== "all" && run.mode !== modeFilter) return false;
    if (statusFilter === "success" && run.success === 0) return false;
    if (statusFilter === "failed"  && run.failed === 0)  return false;
    if (statusFilter === "skipped" && run.skipped === 0) return false;
    if (statusFilter === "prs"     && run.prsOpened === 0) return false;
    return true;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>All Runs</h1>
        <p>{data ? `${data.length} total run${data.length !== 1 ? "s" : ""}` : "Loading…"}</p>
      </div>

      {error && (
        <div className="error-banner">⚠️ {error}</div>
      )}

      {/* Mode filter */}
      <div className="filter-bar">
        <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>Mode:</span>
        {(["all", "scan", "fix", "run"] as FilterMode[]).map((m) => (
          <button
            key={m}
            className={`filter-chip${modeFilter === m ? " active" : ""}`}
            onClick={() => setModeFilter(m)}
          >
            {m === "all" ? "All" : m === "scan" ? "📡 Scan" : m === "fix" ? "🔧 Fix" : "▶️ Run"}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center", marginLeft: 8, marginRight: 4 }}>Result:</span>
        {(["all", "success", "failed", "skipped", "prs"] as FilterStatus[]).map((s) => (
          <button
            key={s}
            className={`filter-chip${statusFilter === s ? " active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "All"
              : s === "success" ? "✅ Success"
              : s === "failed"  ? "❌ Failed"
              : s === "skipped" ? "⏭️ Skipped"
              : "🔀 Has PR"}
          </button>
        ))}
      </div>

      {loading && !data && (
        <div className="loader"><div className="spinner" /><div>Loading runs…</div></div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <h3>{data?.length === 0 ? "No runs yet" : "No runs match filters"}</h3>
          <p>
            {data?.length === 0
              ? <>Run <code>contribot run</code> to start making automated contributions.</>
              : "Try clearing some filters."}
          </p>
        </div>
      )}

      <div className="run-list">
        {filtered.map((run, i) => (
          <RunCard key={run.id} run={run} delay={i * 0.04} />
        ))}
      </div>

      {filtered.length > 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "var(--text-muted)" }}>
          Showing {filtered.length} of {data?.length ?? 0} runs · Auto-refreshes every 10s
        </div>
      )}
    </div>
  );
}
