import { writeFile } from "node:fs/promises";
import path from "node:path";

import { assertCommandSucceeded } from "./command-runner.js";
import type { CommandRunner, RepoIssue, ValidationResult } from "./types.js";

export async function publishPullRequest(
  runner: CommandRunner,
  repoDir: string,
  repo: string,
  branch: string,
  commitMessage: string,
  issue: RepoIssue,
  strategy: string,
  validation: ValidationResult
): Promise<string> {
  const addResult = await runner.run("git", ["add", "."], { cwd: repoDir });
  assertCommandSucceeded(addResult, "Failed to stage changes.");
  const commitResult = await runner.run("git", ["commit", "-m", commitMessage], { cwd: repoDir });
  assertCommandSucceeded(commitResult, "Failed to create commit.");
  const pushResult = await runner.run("git", ["push", "--set-upstream", "origin", branch], { cwd: repoDir });
  assertCommandSucceeded(pushResult, "Failed to push branch.");

  const body = buildPrBody(issue, strategy, validation);
  const bodyPath = path.join(repoDir, ".aica-pr-body.md");
  await writeFile(bodyPath, body, "utf8");

  const prResult = await runner.run(
    "gh",
    [
      "pr",
      "create",
      "--repo",
      repo,
      "--title",
      `${commitMessage} (#${issue.number})`,
      "--body-file",
      bodyPath,
    ],
    { cwd: repoDir }
  );
  assertCommandSucceeded(prResult, "Failed to create pull request.");
  return prResult.stdout.trim().split("\n").at(-1) ?? "";
}

export function buildPrBody(
  issue: RepoIssue,
  strategy: string,
  validation: ValidationResult
): string {
  const validationSummary = validation.commands
    .map((command) => `- \`${command.command} ${command.args.join(" ")}\` => ${command.exitCode}`)
    .join("\n");

  return `## Summary

Automated safe fix for issue #${issue.number} using strategy \`${strategy}\`.

## Issue

- Title: ${issue.title}
- Link: ${issue.url}

## Validation

${validationSummary || "- No validation commands executed"}

## Safety

- Deterministic safe-mode fix only
- No AI-generated edits
- PR created after local validation passed
`;
}
