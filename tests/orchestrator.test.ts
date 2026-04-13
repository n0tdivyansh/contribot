import { describe, expect, it, vi } from "vitest";

import { runScan } from "../src/orchestrator.js";
import type { AicaConfig, CommandResult, CommandRunner } from "../src/types.js";

class MockRunner implements CommandRunner {
  constructor(private readonly handlers: Record<string, CommandResult>) {}

  async run(command: string, args: string[]): Promise<CommandResult> {
    const key = `${command} ${args.join(" ")}`;
    const response = this.handlers[key];
    if (!response) {
      throw new Error(`Unhandled command: ${key}`);
    }
    return response;
  }
}

const config: AicaConfig = {
  repos: ["acme/repo"],
  labels: ["bug"],
  maxPRsPerRun: 1,
  safeMode: true,
  maxDiffLines: 50,
  maxFilesChanged: 5,
  branchPrefix: "aica",
  commitMessageTemplate: "chore: automated safe fix",
  logLevel: "error",
  allowNoTests: [],
};

describe("runScan", () => {
  it("returns ranked scan results and a log path", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const runner = new MockRunner({
      "gh issue list --repo acme/repo --state open --limit 25 --json number,title,body,labels,updatedAt,url": {
        command: "gh",
        args: ["issue", "list"],
        exitCode: 0,
        stdout: JSON.stringify([
          {
            number: 1,
            title: "Fix lint warnings",
            body: "eslint autofix",
            labels: [{ name: "bug" }],
            updatedAt: new Date().toISOString(),
            url: "https://github.com/acme/repo/issues/1",
          },
        ]),
        stderr: "",
      },
    });

    const result = await runScan(runner, config, "acme/repo", { publish: false, debug: false });
    expect(result.scanResults[0]?.issues[0]?.number).toBe(1);
    expect(result.logPath).toMatch(/^logs\/run-/);
  });
});
