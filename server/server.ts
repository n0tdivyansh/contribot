import express from "express";
import cors from "cors";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.resolve(__dirname, "..", "logs");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Types (mirror of src/types/types.ts) ────────────────────────────────────

interface LogEvent {
  timestamp: string;
  level: string;
  event: string;
  repo?: string;
  message: string;
  data?: Record<string, unknown>;
}

interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
  binaryFiles: string[];
  lockfilesChanged: string[];
}

interface ValidationResult {
  ok: boolean;
  reason: string;
  commands: Array<{ command: string; args: string[]; exitCode: number }>;
  diffStats?: DiffStats;
}

interface RepoRunResult {
  repo: string;
  status: "success" | "skipped" | "failed";
  issue?: { number: number; title: string; url: string };
  selectedStrategy?: string;
  validation?: ValidationResult;
  branch?: string;
  prUrl?: string;
  failureReason?: string;
  workspacePath?: string;
}

interface RunLog {
  startedAt: string;
  finishedAt?: string;
  mode: "scan" | "fix" | "run";
  publish: boolean;
  events: LogEvent[];
  results: RepoRunResult[];
}

interface RunSummary {
  id: string;
  filename: string;
  startedAt: string;
  finishedAt?: string;
  mode: "scan" | "fix" | "run";
  publish: boolean;
  durationMs?: number;
  totalRepos: number;
  success: number;
  failed: number;
  skipped: number;
  prsOpened: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function readAllLogs(): Promise<{ filename: string; log: RunLog }[]> {
  let files: string[];
  try {
    files = await readdir(LOGS_DIR);
  } catch {
    return [];
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort().reverse();

  const results = await Promise.all(
    jsonFiles.map(async (filename) => {
      try {
        const raw = await readFile(path.join(LOGS_DIR, filename), "utf8");
        const log = JSON.parse(raw) as RunLog;
        return { filename, log };
      } catch {
        return null;
      }
    })
  );

  return results.filter(Boolean) as { filename: string; log: RunLog }[];
}

function summarise(filename: string, log: RunLog): RunSummary {
  const id = filename.replace(".json", "");
  const success = log.results.filter((r) => r.status === "success").length;
  const failed = log.results.filter((r) => r.status === "failed").length;
  const skipped = log.results.filter((r) => r.status === "skipped").length;
  const prsOpened = log.results.filter((r) => r.prUrl).length;
  const durationMs =
    log.finishedAt
      ? new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()
      : undefined;

  return {
    id,
    filename,
    startedAt: log.startedAt,
    finishedAt: log.finishedAt,
    mode: log.mode,
    publish: log.publish,
    durationMs,
    totalRepos: log.results.length,
    success,
    failed,
    skipped,
    prsOpened,
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// GET /api/stats  — aggregate stats across all runs
app.get("/api/stats", async (_req, res) => {
  const all = await readAllLogs();
  const repos = new Set<string>();

  let totalRuns = all.length;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalPRs = 0;
  let totalScans = 0;
  let totalFixes = 0;

  for (const { log } of all) {
    for (const r of log.results) {
      repos.add(r.repo);
      if (r.status === "success") totalSuccess++;
      if (r.status === "failed") totalFailed++;
      if (r.status === "skipped") totalSkipped++;
      if (r.prUrl) totalPRs++;
    }
    if (log.mode === "scan") totalScans++;
    if (log.mode === "fix" || log.mode === "run") totalFixes++;
  }

  const totalProcessed = totalSuccess + totalFailed + totalSkipped;
  const successRate = totalProcessed > 0 ? Math.round((totalSuccess / totalProcessed) * 100) : 0;

  // Strategy breakdown
  const strategyCount: Record<string, number> = {};
  for (const { log } of all) {
    for (const r of log.results) {
      if (r.selectedStrategy) {
        strategyCount[r.selectedStrategy] = (strategyCount[r.selectedStrategy] ?? 0) + 1;
      }
    }
  }

  // Latest run
  const latest = all[0] ? summarise(all[0].filename, all[0].log) : null;

  res.json({
    totalRuns,
    totalScans,
    totalFixes,
    totalSuccess,
    totalFailed,
    totalSkipped,
    totalPRs,
    successRate,
    reposTracked: repos.size,
    strategyBreakdown: strategyCount,
    latestRun: latest,
  });
});

// GET /api/runs  — list all run summaries (newest first)
app.get("/api/runs", async (_req, res) => {
  const all = await readAllLogs();
  const summaries = all.map(({ filename, log }) => summarise(filename, log));
  res.json(summaries);
});

// GET /api/runs/:id  — full log for a specific run
app.get("/api/runs/:id", async (req, res) => {
  const filename = `${req.params.id}.json`;
  const filepath = path.join(LOGS_DIR, filename);
  try {
    const raw = await readFile(filepath, "utf8");
    const log = JSON.parse(raw) as RunLog;
    res.json({ id: req.params.id, filename, ...log });
  } catch {
    res.status(404).json({ error: "Run not found." });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`\x1b[32m✓\x1b[0m Contribot API server running at http://localhost:${PORT}`);
  console.log(`  Serving logs from: ${LOGS_DIR}`);
});
