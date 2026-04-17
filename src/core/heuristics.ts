import type { RepoIssue, SafeStrategy, ScoredIssue, ToolchainInfo } from "../types/types.js";

const riskyKeywords = [
  "feature",
  "architecture",
  "refactor",
  "breaking",
  "design",
  "investigate",
  "discussion",
  "proposal",
  "rewrite",
  "migration",
];

const lintKeywords = ["lint", "eslint", "ruff", "flake8"];
const formatKeywords = ["format", "prettier", "black", "style", "whitespace"];
const dependencyKeywords = ["dependency", "dependencies", "upgrade", "update", "bump"];
const textKeywords = ["typo", "readme", "docs", "documentation", "spelling"];

export function isAutomatableIssue(issue: RepoIssue, labels: string[]): boolean {
  const haystack = `${issue.title} ${issue.body}`.toLowerCase();
  if (riskyKeywords.some((keyword) => haystack.includes(keyword))) {
    return false;
  }

  if (labels.length > 0 && !issue.labels.some((label) => labels.includes(label))) {
    return false;
  }

  return (
    lintKeywords.some((keyword) => haystack.includes(keyword)) ||
    formatKeywords.some((keyword) => haystack.includes(keyword)) ||
    dependencyKeywords.some((keyword) => haystack.includes(keyword)) ||
    textKeywords.some((keyword) => haystack.includes(keyword))
  );
}

export function scoreIssue(issue: RepoIssue): ScoredIssue {
  const haystack = `${issue.title} ${issue.body}`.toLowerCase();
  let score = 0;
  let reason = "Generic safe candidate";

  if (lintKeywords.some((keyword) => haystack.includes(keyword))) {
    score += 5;
    reason = "Lint-related issue";
  }
  if (formatKeywords.some((keyword) => haystack.includes(keyword))) {
    score += 4;
    reason = "Formatting-related issue";
  }
  if (dependencyKeywords.some((keyword) => haystack.includes(keyword))) {
    score += 3;
    reason = "Dependency update issue";
  }
  if (textKeywords.some((keyword) => haystack.includes(keyword))) {
    score += 2;
    reason = "Text cleanup issue";
  }

  const updatedAt = new Date(issue.updatedAt).getTime();
  const ageDays = Math.max(0, Math.floor((Date.now() - updatedAt) / (1000 * 60 * 60 * 24)));
  score += Math.max(0, 7 - ageDays);

  return {
    ...issue,
    score,
    reason,
  };
}

export function selectStrategy(issue: RepoIssue, toolchain: ToolchainInfo): SafeStrategy {
  const haystack = `${issue.title} ${issue.body}`.toLowerCase();

  if (lintKeywords.some((keyword) => haystack.includes(keyword)) && toolchain.hasLinter) {
    return "lint-fix";
  }
  if (formatKeywords.some((keyword) => haystack.includes(keyword)) && toolchain.hasFormatter) {
    return "format-fix";
  }
  if (
    dependencyKeywords.some((keyword) => haystack.includes(keyword)) &&
    toolchain.supportsDependencyUpdates
  ) {
    return "dependency-update";
  }
  if (textKeywords.some((keyword) => haystack.includes(keyword))) {
    return "text-cleanup";
  }
  return "skip";
}
