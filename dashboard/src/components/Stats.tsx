import type { Stats as StatsType } from "../types";

interface Props {
  stats: StatsType;
}

export function Stats({ stats }: Props) {
  const cards = [
    { icon: "🔄", label: "Total Runs",      value: stats.totalRuns,      cls: "primary" },
    { icon: "✅", label: "Successful",       value: stats.totalSuccess,   cls: "success" },
    { icon: "❌", label: "Failed",           value: stats.totalFailed,    cls: "failed"  },
    { icon: "⏭️", label: "Skipped",          value: stats.totalSkipped,   cls: "skipped" },
    { icon: "🔀", label: "PRs Opened",       value: stats.totalPRs,       cls: ""        },
    { icon: "📦", label: "Repos Tracked",    value: stats.reposTracked,   cls: ""        },
    { icon: "📡", label: "Scans",            value: stats.totalScans,     cls: ""        },
    { icon: "🔧", label: "Fix Runs",         value: stats.totalFixes,     cls: ""        },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`stat-card${card.cls ? ` ${card.cls}` : ""}`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <span className="stat-icon">{card.icon}</span>
          <div className="stat-value">{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SuccessRateCard({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--skipped)" : "var(--failed)";

  return (
    <div className="stat-card" style={{ gridColumn: "span 2" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="stat-label">Success Rate</span>
        <span style={{ fontSize: 28, fontWeight: 800, color }}>{rate}%</span>
      </div>
      <div className="diff-bar-track" style={{ height: 8 }}>
        <div
          className="diff-bar-fill"
          style={{ width: `${rate}%`, background: color, transition: "width 0.8s ease" }}
        />
      </div>
    </div>
  );
}
