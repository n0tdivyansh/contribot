import { describe, expect, it } from "vitest";

import { collectDiffStats } from "../src/core/validator.js";
import type { CommandResult, CommandRunner } from "../src/types/types.js";

class FakeRunner implements CommandRunner {
  constructor(private readonly responses: Record<string, CommandResult>) {}

  async run(command: string, args: string[]): Promise<CommandResult> {
    const key = `${command} ${args.join(" ")}`;
    const result = this.responses[key];
    if (!result) {
      throw new Error(`Missing fake response for ${key}`);
    }
    return result;
  }
}

describe("collectDiffStats", () => {
  it("parses git diff output and detects binary/lockfile changes", async () => {
    const runner = new FakeRunner({
      "git diff --shortstat": {
        command: "git",
        args: ["diff", "--shortstat"],
        exitCode: 0,
        stdout: " 2 files changed, 12 insertions(+), 3 deletions(-)\n",
        stderr: "",
      },
      "git diff --numstat": {
        command: "git",
        args: ["diff", "--numstat"],
        exitCode: 0,
        stdout: "10\t3\tsrc/index.ts\n-\t-\timage.png\n2\t0\tpackage-lock.json\n",
        stderr: "",
      },
    });

    const stats = await collectDiffStats(runner, "/tmp/repo");
    expect(stats.filesChanged).toBe(2);
    expect(stats.insertions).toBe(12);
    expect(stats.binaryFiles).toEqual(["image.png"]);
    expect(stats.lockfilesChanged).toEqual(["package-lock.json"]);
  });
});
