// ─── Mirror of server-side types ─────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";
export type RunMode = "scan" | "fix" | "run";
export type RepoStatus = "success" | "skipped" | "failed";
export type SafeStrategy = "lint-fix" | "format-fix" | "dependency-update" | "text-cleanup" | "skip";

export interface LogEvent {
  timestamp: string;
  level: LogLevel;
  event: "scan" | "selection" | "fix" | "validation" | "publish" | "skip" | "failure" | "summary";
  repo?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
  binaryFiles: string[];
  lockfilesChanged: string[];
}

export interface ValidationResult {
  ok: boolean;
  reason: string;
  commands: Array<{ command: string; args: string[]; exitCode: number }>;
  diffStats?: DiffStats;
}

export interface RepoIssue {
  number: number;
  title: string;
  url: string;
}

export interface RepoRunResult {
  repo: string;
  status: RepoStatus;
  issue?: RepoIssue;
  selectedStrategy?: SafeStrategy;
  validation?: ValidationResult;
  branch?: string;
  prUrl?: string;
  failureReason?: string;
  workspacePath?: string;
}

export interface RunLog {
  id: string;
  filename: string;
  startedAt: string;
  finishedAt?: string;
  mode: RunMode;
  publish: boolean;
  events: LogEvent[];
  results: RepoRunResult[];
}

export interface RunSummary {
  id: string;
  filename: string;
  startedAt: string;
  finishedAt?: string;
  mode: RunMode;
  publish: boolean;
  durationMs?: number;
  totalRepos: number;
  success: number;
  failed: number;
  skipped: number;
  prsOpened: number;
}

export interface Stats {
  totalRuns: number;
  totalScans: number;
  totalFixes: number;
  totalSuccess: number;
  totalFailed: number;
  totalSkipped: number;
  totalPRs: number;
  successRate: number;
  reposTracked: number;
  strategyBreakdown: Record<string, number>;
  latestRun: RunSummary | null;
}
