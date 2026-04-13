import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { initConfig } from "../src/init.js";

describe("initConfig", () => {
  it("creates a starter config file", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "aica-init-"));
    const filePath = path.join(dir, "aica.config.json");

    const writtenPath = await initConfig({ configPath: filePath, force: false });
    const contents = JSON.parse(await readFile(filePath, "utf8")) as { repos: string[]; safeMode: boolean };

    expect(writtenPath).toBe(filePath);
    expect(contents.repos).toEqual(["owner/repo"]);
    expect(contents.safeMode).toBe(true);
  });

  it("refuses to overwrite without force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "aica-init-"));
    const filePath = path.join(dir, "aica.config.json");

    await initConfig({ configPath: filePath, force: false });
    await expect(initConfig({ configPath: filePath, force: false })).rejects.toThrow(/--force/);
  });
});
