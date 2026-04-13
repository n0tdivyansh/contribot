import { isAutomatableIssue, scoreIssue } from "./heuristics.js";
import type { CommandRunner, RepoIssue, ScanResult } from "./types.js";

function parseIssues(stdout: string): RepoIssue[] {
  const parsed = JSON.parse(stdout) as Array<{
    number: number;
    title: string;
    body?: string | null;
    labels: Array<{ name: string }>;
    updatedAt: string;
    url: string;
  }>;

  return parsed.map((issue) => ({
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    labels: issue.labels.map((label) => label.name),
    updatedAt: issue.updatedAt,
    url: issue.url,
  }));
}

export async function scanRepository(
  runner: CommandRunner,
  repo: string,
  labels: string[]
): Promise<ScanResult> {
  const result = await runner.run("gh", [
    "issue",
    "list",
    "--repo",
    repo,
    "--state",
    "open",
    "--limit",
    "25",
    "--json",
    "number,title,body,labels,updatedAt,url",
  ]);

  if (result.exitCode !== 0) {
    return {
      repo,
      issues: [],
      skippedReason: result.stderr.trim() || "Failed to query GitHub issues.",
    };
  }

  const issues = parseIssues(result.stdout)
    .filter((issue) => isAutomatableIssue(issue, labels))
    .map((issue) => scoreIssue(issue))
    .sort((a, b) => b.score - a.score);

  return { repo, issues };
}
