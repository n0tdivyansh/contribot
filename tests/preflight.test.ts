import { describe, expect, it } from "vitest";

import { assertPreflight, runPreflightChecks } from "../src/preflight.js";
import type { CommandResult, CommandRunner } from "../src/types.js";

class FakeRunner implements CommandRunner {
  constructor(
    private readonly responses: Record<string, CommandResult>,
    private readonly throws: string[] = []
  ) {}

  async run(command: string, args: string[]): Promise<CommandResult> {
    const key = `${command} ${args.join(" ")}`;
    if (this.throws.includes(key)) {
      throw new Error(`${command} missing`);
    }
    const response = this.responses[key];
    if (!response) {
      throw new Error(`Unhandled ${key}`);
    }
    return response;
  }
}

describe("preflight", () => {
  it("collects successful checks", async () => {
    const runner = new FakeRunner({
      "git --version": { command: "git", args: ["--version"], exitCode: 0, stdout: "git version 2.0", stderr: "" },
      "gh --version": { command: "gh", args: ["--version"], exitCode: 0, stdout: "gh version 2.0", stderr: "" },
      "gh auth status": { command: "gh", args: ["auth", "status"], exitCode: 0, stdout: "logged in", stderr: "" },
      "python --version": { command: "python", args: ["--version"], exitCode: 0, stdout: "Python 3.12", stderr: "" },
    });

    const checks = await runPreflightChecks(runner, {
      requireGit: true,
      requireGh: true,
      requireGitHubAuth: true,
      requirePython: true,
    });

    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it("throws on required check failure", () => {
    expect(() =>
      assertPreflight([{ name: "gh", ok: false, message: "not authenticated" }])
    ).toThrow(/Preflight checks failed/);
  });
});
