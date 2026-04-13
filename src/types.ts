export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AicaConfig {
  repos: string[];
  labels: string[];
  maxPRsPerRun: number;
  safeMode: boolean;
  maxDiffLines: number;
  maxFilesChanged: number;
  branchPrefix: string;
  commitMessageTemplate: string;
  logLevel: LogLevel;
  allowNoTests: string[];
}

export interface CliOptions {
  configPath?: string;
  publish: boolean;
  debug: boolean;
}

export interface InitOptions {
  configPath?: string;
  force: boolean;
}

export interface PreflightCheck {
  name: string;
  ok: boolean;
  message: string;
}

export interface RepoIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  updatedAt: string;
  url: string;
}

export type SafeStrategy =
  | "lint-fix"
  | "format-fix"
  | "dependency-update"
  | "text-cleanup"
  | "skip";

export interface ScoredIssue extends RepoIssue {
  score: number;
  reason: string;
}

export interface ScanResult {
  repo: string;
  issues: ScoredIssue[];
  skippedReason?: string;
}

export interface StrategyDecision {
  strategy: SafeStrategy;
  reason: string;
}

export interface ToolchainInfo {
  repo: string;
  rootDir: string;
  ecosystem: "node" | "python" | "unknown";
  packageManager?: "npm" | "pnpm" | "yarn";
  hasFormatter: boolean;
  hasLinter: boolean;
  hasTests: boolean;
  hasBuild: boolean;
  hasPinnedPythonTools: boolean;
  supportsDependencyUpdates: boolean;
}

export interface CommandResult {
  command: string;
  args: string[];
  cwd?: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface ExecutionContext {
  publish: boolean;
  debug: boolean;
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
  commands: CommandResult[];
  diffStats?: DiffStats;
}

export interface RepoRunResult {
  repo: string;
  status: "success" | "skipped" | "failed";
  issue?: RepoIssue;
  selectedStrategy?: SafeStrategy;
  validation?: ValidationResult;
  branch?: string;
  prUrl?: string;
  failureReason?: string;
  workspacePath?: string;
}

export interface LogEvent {
  timestamp: string;
  level: LogLevel;
  event:
    | "scan"
    | "selection"
    | "fix"
    | "validation"
    | "publish"
    | "skip"
    | "failure"
    | "summary";
  repo?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface RunLog {
  startedAt: string;
  finishedAt?: string;
  mode: "scan" | "fix" | "run";
  publish: boolean;
  events: LogEvent[];
  results: RepoRunResult[];
}

export interface CommandRunner {
  run(
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv }
  ): Promise<CommandResult>;
}
