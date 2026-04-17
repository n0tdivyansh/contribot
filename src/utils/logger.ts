import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LogEvent, LogLevel, RepoRunResult, RunLog } from "../types/types.js";

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class RunLogger {
  private readonly runLog: RunLog;

  constructor(
    private readonly mode: "scan" | "fix" | "run",
    private readonly publish: boolean,
    private readonly minLevel: LogLevel
  ) {
    this.runLog = {
      startedAt: new Date().toISOString(),
      mode,
      publish,
      events: [],
      results: [],
    };
  }

  log(event: LogEvent): void {
    this.runLog.events.push(event);
    if (levelWeight[event.level] < levelWeight[this.minLevel]) {
      return;
    }

    const prefix = `[${event.timestamp}] [${event.level.toUpperCase()}] [${event.event}]`;
    const repo = event.repo ? ` [${event.repo}]` : "";
    console.log(`${prefix}${repo} ${event.message}`);
  }

  pushResult(result: RepoRunResult): void {
    this.runLog.results.push(result);
  }

  async flush(): Promise<string> {
    this.runLog.finishedAt = new Date().toISOString();
    await mkdir("logs", { recursive: true });
    const outputPath = path.join("logs", `run-${Date.now()}.json`);
    await writeFile(outputPath, JSON.stringify(this.runLog, null, 2), "utf8");
    return outputPath;
  }

  summary(): RunLog {
    return this.runLog;
  }
}

export function createEvent(
  level: LogLevel,
  event: LogEvent["event"],
  message: string,
  repo?: string,
  data?: Record<string, unknown>
): LogEvent {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    repo,
    message,
    data,
  };
}
