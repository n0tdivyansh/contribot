import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadConfig, resolveRepos } from "../src/config.js";

describe("config", () => {
  it("merges defaults with user config", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "contribot-config-"));
    const filePath = path.join(dir, "contribot.config.json");
    await writeFile(
      filePath,
      JSON.stringify({
        repos: ["octocat/hello-world"],
        maxPRsPerRun: 2,
        safeMode: true,
      }),
      "utf8"
    );

    const config = await loadConfig(filePath);
    expect(config.labels).toEqual(["bug", "good first issue"]);
    expect(config.maxPRsPerRun).toBe(2);
    expect(resolveRepos(config)).toEqual(["octocat/hello-world"]);
  });

  it("rejects disabled safe mode", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "contribot-config-"));
    const filePath = path.join(dir, "contribot.config.json");
    await writeFile(
      filePath,
      JSON.stringify({
        repos: [],
        safeMode: false,
      }),
      "utf8"
    );

    await expect(loadConfig(filePath)).rejects.toThrow(/safeMode/);
  });
});
