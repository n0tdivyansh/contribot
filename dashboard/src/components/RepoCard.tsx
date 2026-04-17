import type { RepoRunResult } from "../types";

interface Props {
  result: RepoRunResult;
  delay?: number;
}

const STRATEGY_LABELS: Record<string, string> = {
  "lint-fix":          "🔍 lint-fix",
  "format-fix":        "✨ format-fix",
  "dependency-update": "📦 dep-update",
  "text-cleanup":      "📝 text-cleanup",
  "skip":              "⏭️ skip",
};

function StatusBadge({ status }: { status: RepoRunResult["status"] }) {
  const cls = `badge badge-${status}`;
  const labels = { success: "✓ success", failed: "✗ failed", skipped: "— skipped" };
  return <span className={cls}>{labels[status]}</span>;
}

export function RepoCard({ result, delay = 0 }: Props) {
  const diff = result.validation?.diffStats;
  const totalLines = (diff?.insertions ?? 0) + (diff?.deletions ?? 0);
  const maxLines = 500;
  const barPct = Math.min(100, totalLines > 0 ? (totalLines / maxLines) * 100 : 0);

  return (
    <div
      className={`repo-result-card ${result.status}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="repo-result-header">
        <span className="repo-result-name">{result.repo}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {result.selectedStrategy && result.selectedStrategy !== "skip" && (
            <span className="badge badge-neutral" style={{ fontFamily: "var(--font-mono)" }}>
              {STRATEGY_LABELS[result.selectedStrategy] ?? result.selectedStrategy}
            </span>
          )}
          <StatusBadge status={result.status} />
        </div>
      </div>

      <div className="repo-result-body">
        {/* Issue */}
        {result.issue && (
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="text-muted">Issue #{result.issue.number}:</span>{" "}
            <a href={result.issue.url} target="_blank" rel="noreferrer" className="pr-link">
              {result.issue.title}
            </a>
          </div>
        )}

        {/* Branch */}
        {result.branch && (
          <div className="text-xs mono" style={{ color: "var(--text-muted)" }}>
            Branch: <span style={{ color: "var(--primary-light)" }}>{result.branch}</span>
          </div>
        )}

        {/* PR link */}
        {result.prUrl && (
          <a href={result.prUrl} target="_blank" rel="noreferrer" className="pr-link text-sm">
            🔀 View Pull Request
            <svg style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        )}

        {/* Failure reason */}
        {result.failureReason && result.status !== "skipped" && (
          <div className="error-banner" style={{ margin: 0, fontSize: 12 }}>
            ⚠️ {result.failureReason}
          </div>
        )}

        {/* Skipped reason */}
        {result.status === "skipped" && result.failureReason && (
          <div className="text-xs" style={{ color: "var(--skipped)" }}>
            ⏭️ {result.failureReason}
          </div>
        )}

        {/* Diff stats */}
        {diff && (
          <>
            <div className="diff-bar-row">
              <div className="diff-bar-track">
                <div className="diff-bar-fill" style={{ width: `${barPct}%` }} />
              </div>
              <span className="text-xs text-muted">{totalLines} lines</span>
            </div>
            <div className="diff-stats-row">
              <span className="diff-stat files">📁 {diff.filesChanged} file{diff.filesChanged !== 1 ? "s" : ""}</span>
              <span className="diff-stat ins">+{diff.insertions}</span>
              <span className="diff-stat del">−{diff.deletions}</span>
              {diff.lockfilesChanged.length > 0 && (
                <span className="diff-stat" style={{ color: "var(--skipped)" }}>🔒 lockfile</span>
              )}
            </div>
          </>
        )}

        {/* Validation status */}
        {result.validation && (
          <div
            className="text-xs"
            style={{ color: result.validation.ok ? "var(--success)" : "var(--failed)" }}
          >
            {result.validation.ok ? "✓" : "✗"} {result.validation.reason}
          </div>
        )}
      </div>
    </div>
  );
}
