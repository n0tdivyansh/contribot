import type { LogEvent } from "../types";

interface Props {
  events: LogEvent[];
  maxItems?: number;
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const EVENT_ICONS: Record<string, string> = {
  scan:       "📡",
  selection:  "🎯",
  fix:        "🔧",
  validation: "🧪",
  publish:    "🔀",
  skip:       "⏭️",
  failure:    "❌",
  summary:    "📊",
};

export function ActivityFeed({ events, maxItems = 30 }: Props) {
  if (events.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "30px 0" }}>
        <div className="empty-state-icon">📭</div>
        <p>No events recorded yet.</p>
      </div>
    );
  }

  const visible = events.slice(0, maxItems);

  return (
    <div className="activity-feed">
      {visible.map((event, i) => (
        <div
          className="activity-item"
          key={i}
          style={{ animationDelay: `${i * 0.02}s` }}
        >
          <div className="activity-dot-col">
            <div className={`activity-dot ${event.level}`} />
            {i < visible.length - 1 && <div className="activity-line" />}
          </div>

          <div className="activity-content">
            <div className="activity-header">
              <span className="activity-event">
                {EVENT_ICONS[event.event] ?? "•"} {event.event}
              </span>
              <span className="activity-time">{formatTime(event.timestamp)}</span>
            </div>
            <div className="activity-message">{event.message}</div>
            {event.repo && <div className="activity-repo">↳ {event.repo}</div>}
          </div>
        </div>
      ))}
      {events.length > maxItems && (
        <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "var(--text-muted)" }}>
          + {events.length - maxItems} more events
        </div>
      )}
    </div>
  );
}
