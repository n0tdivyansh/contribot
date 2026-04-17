import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { assertCommandSucceeded } from "../cli/command-runner.js";
import type { CommandRunner } from "../types/types.js";

export interface WorkspaceHandle {
  tempDir: string;
  repoDir: string;
  branchName: string;
}

export async function createWorkspace(
  runner: CommandRunner,
  repo: string,
  branchPrefix: string,
  strategy: string,
  issueNumber: number
): Promise<WorkspaceHandle> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "contribot-"));
  const repoDir = path.join(tempDir, repo.replace("/", "__"));
  const cloneResult = await runner.run("gh", ["repo", "clone", repo, repoDir, "--", "--depth", "1"]);
  assertCommandSucceeded(cloneResult, `Failed to clone repository ${repo}.`);

  const branchName = `${branchPrefix}/${strategy}/${issueNumber}`;
  const checkoutResult = await runner.run("git", ["checkout", "-b", branchName], { cwd: repoDir });
  assertCommandSucceeded(checkoutResult, `Failed to create branch ${branchName}.`);

  return { tempDir, repoDir, branchName };
}

export async function cleanupWorkspace(tempDir: string, debug: boolean): Promise<void> {
  if (debug) {
    return;
  }
  await rm(tempDir, { recursive: true, force: true });
}
