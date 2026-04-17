import { useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useApi";
import { Stats, SuccessRateCard } from "../components/Stats";
import { RunCard } from "../components/RunCard";
import { ActivityFeed } from "../components/ActivityFeed";
import type { Stats as StatsType, RunSummary, RunLog } from "../types";

export function Overview() {
  const navigate = useNavigate();
  const statsApi = useFetch<StatsType>("/api/stats");
  const runsApi = useFetch<RunSummary[]>("/api/runs");

  // Fetch latest run log for activity feed
  const latestId = runsApi.data?.[0]?.id;
  const latestRunApi = useFetch<RunLog>(
    latestId ? `/api/runs/${latestId}` : "",
    10_000
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>Overview</h1>
        <p>Live summary of all Contribot automation activity</p>
      </div>

      {/* Stats */}
      {statsApi.error && (
        <div className="error-banner">
          ⚠️ Cannot reach API server — start it with <code style={{ marginLeft: 6, fontFamily: "var(--font-mono)", background: "transparent" }}>npm run dev</code> in the <code style={{ fontFamily: "var(--font-mono)", background: "transparent" }}>server/</code> directory.
        </div>
      )}

      {statsApi.loading && !statsApi.data && (
        <div className="loader"><div className="spinner" /><div>Loading stats…</div></div>
      )}

      {statsApi.data && (
        <>
          <Stats stats={statsApi.data} />

          {/* Strategy breakdown + success rate */}
          <div className="section-grid" style={{ marginBottom: 24 }}>
            {/* Strategy breakdown */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Strategy Breakdown</span>
                <span className="badge badge-neutral">{Object.values(statsApi.data.strategyBreakdown).reduce((a, b) => a + b, 0)} total</span>
              </div>
              <div className="card-body">
                {Object.keys(statsApi.data.strategyBreakdown).length === 0 ? (
                  <div className="empty-state" style={{ padding: "24px 0" }}>
                    <p>No strategy data yet.</p>
                  </div>
                ) : (
                  <div className="strategy-grid">
                    {Object.entries(statsApi.data.strategyBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([strategy, count]) => {
                        const total = Object.values(statsApi.data!.strategyBreakdown).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div className="strategy-row" key={strategy}>
                            <span className="strategy-name">{strategy}</span>
                            <div className="strategy-bar-track">
                              <div className="strategy-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="strategy-count">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Success rate + latest run info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="card">
                <div className="card-body">
                  <SuccessRateCard rate={statsApi.data.successRate} />
                </div>
              </div>
              {statsApi.data.latestRun && (
                <div
                  className="card"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/runs/${statsApi.data!.latestRun!.id}`)}
                >
                  <div className="card-header">
                    <span className="card-title">Latest Run</span>
                    <span className={`badge badge-mode-${statsApi.data.latestRun.mode}`}>
                      {statsApi.data.latestRun.mode}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="run-detail-meta">
                      <div className="run-detail-meta-item">
                        <span className="run-detail-meta-label">Started</span>
                        <span className="run-detail-meta-value" style={{ fontSize: 12 }}>
                          {new Date(statsApi.data.latestRun.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="run-detail-meta-item">
                        <span className="run-detail-meta-label">Repos</span>
                        <span className="run-detail-meta-value">{statsApi.data.latestRun.totalRepos}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Recent runs + Activity feed */}
      <div className="section-grid">
        {/* Recent runs */}
        <div>
          <div className="section-label">Recent Runs</div>
          {runsApi.loading && !runsApi.data && (
            <div className="loader"><div className="spinner" /></div>
          )}
          {runsApi.data?.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🤖</div>
              <h3>No runs yet</h3>
              <p>
                Run <code>contribot scan owner/repo</code> or <code>contribot run</code> to see results here.
              </p>
            </div>
          )}
          <div className="run-list">
            {(runsApi.data ?? []).slice(0, 8).map((run, i) => (
              <RunCard key={run.id} run={run} delay={i * 0.05} />
            ))}
          </div>
          {(runsApi.data?.length ?? 0) > 8 && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => navigate("/runs")}>
                View all {runsApi.data!.length} runs →
              </button>
            </div>
          )}
        </div>

        {/* Activity feed from latest run */}
        <div>
          <div className="section-label">
            Latest Activity
            {latestId && <span className="text-xs text-muted" style={{ marginLeft: 8, textTransform: "none" }}>from {latestId}</span>}
          </div>
          <div className="card">
            <div className="card-body" style={{ padding: "8px 16px" }}>
              {!latestId && (
                <div className="empty-state" style={{ padding: "24px 0" }}>
                  <p>No activity to show yet.</p>
                </div>
              )}
              {latestRunApi.loading && !latestRunApi.data && latestId && (
                <div className="loader" style={{ padding: "24px 0" }}><div className="spinner" /></div>
              )}
              {latestRunApi.data && (
                <ActivityFeed events={latestRunApi.data.events} maxItems={20} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
