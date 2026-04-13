import { access, readFile } from "node:fs/promises";
import path from "node:path";

import type { AicaConfig } from "./types.js";

export const defaultConfig: AicaConfig = {
  repos: [],
  labels: ["bug", "good first issue"],
  maxPRsPerRun: 1,
  safeMode: true,
  maxDiffLines: 200,
  maxFilesChanged: 10,
  branchPrefix: "aica",
  commitMessageTemplate: "chore: apply safe automated fix",
  logLevel: "info",
  allowNoTests: [],
};

export async function loadConfig(configPath?: string): Promise<AicaConfig> {
  const resolvedPath = path.resolve(configPath ?? "aica.config.json");
  const raw = await readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<AicaConfig>;
  const config = {
    ...defaultConfig,
    ...parsed,
  };

  validateConfig(config);
  return config;
}

function validateConfig(config: AicaConfig): void {
  if (!Array.isArray(config.repos)) {
    throw new Error("Config field `repos` must be an array of owner/repo strings.");
  }
  if (config.repos.some((repo) => typeof repo !== "string" || !/^[^/\s]+\/[^/\s]+$/.test(repo))) {
    throw new Error("Each entry in `repos` must use owner/repo format.");
  }
  if (!Array.isArray(config.labels)) {
    throw new Error("Config field `labels` must be an array of label names.");
  }
  if (config.labels.some((label) => typeof label !== "string" || label.trim() === "")) {
    throw new Error("Each entry in `labels` must be a non-empty string.");
  }
  if (!Array.isArray(config.allowNoTests)) {
    throw new Error("Config field `allowNoTests` must be an array of owner/repo strings.");
  }
  if (
    config.allowNoTests.some(
      (repo) => typeof repo !== "string" || !/^[^/\s]+\/[^/\s]+$/.test(repo)
    )
  ) {
    throw new Error("Each entry in `allowNoTests` must use owner/repo format.");
  }
  if (config.maxPRsPerRun < 1) {
    throw new Error("Config field `maxPRsPerRun` must be at least 1.");
  }
  if (config.maxDiffLines < 1 || config.maxFilesChanged < 1) {
    throw new Error("Diff guardrails must be positive integers.");
  }
  if (!config.safeMode) {
    throw new Error("MVP requires `safeMode` to remain enabled.");
  }
  if (!["debug", "info", "warn", "error"].includes(config.logLevel)) {
    throw new Error("Config field `logLevel` must be one of debug, info, warn, or error.");
  }
  if (!config.branchPrefix.trim()) {
    throw new Error("Config field `branchPrefix` must be a non-empty string.");
  }
  if (!config.commitMessageTemplate.trim()) {
    throw new Error("Config field `commitMessageTemplate` must be a non-empty string.");
  }
}

export function resolveRepos(config: AicaConfig, explicitRepo?: string): string[] {
  if (explicitRepo) {
    return [explicitRepo];
  }
  return config.repos;
}

export async function configExists(configPath?: string): Promise<boolean> {
  try {
    await access(path.resolve(configPath ?? "aica.config.json"));
    return true;
  } catch {
    return false;
  }
}
