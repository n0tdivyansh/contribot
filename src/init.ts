import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { configExists, defaultConfig } from "./utils/config.js";
import type { InitOptions } from "./types/types.js";

export async function initConfig(options: InitOptions): Promise<string> {
  const configPath = path.resolve(options.configPath ?? "contribot.config.json");
  const exists = await configExists(configPath);
  if (exists && !options.force) {
    throw new Error(`Config already exists at ${configPath}. Re-run with --force to overwrite it.`);
  }

  await mkdir(path.dirname(configPath), { recursive: true });
  const starterConfig = {
    ...defaultConfig,
    repos: ["owner/repo"],
  };
  await writeFile(configPath, `${JSON.stringify(starterConfig, null, 2)}\n`, "utf8");
  return configPath;
}
