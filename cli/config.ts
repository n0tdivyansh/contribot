import { access, readFile } from "node:fs/promises";
import path from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ContribotConfig {
  repos: string[];
  labels: string[];
  maxPRsPerRun: number;
  safeMode: boolean;
  maxDiffLines: number;
  maxFilesChanged: number;
  branchPrefix: string;
  commitMessageTemplate: string;
  logLevel: LogLevel;
  allowNoTests: string[];
}

export const defaultConfig: ContribotConfig = {
  repos: [],
  labels: ["bug", "good first issue"],
  maxPRsPerRun: 1,
  safeMode: true,
  maxDiffLines: 200,
  maxFilesChanged: 10,
  branchPrefix: "contribot",
  commitMessageTemplate: "chore: apply safe automated fix",
  logLevel: "info",
  allowNoTests: [],
};

export async function loadConfig(
  configPath = "contribot.config.json"
): Promise<ContribotConfig> {
  const resolvedPath = path.resolve(configPath);
  const exists = await configExists(resolvedPath);

  if (!exists) {
    validateConfig(defaultConfig);
    return { ...defaultConfig };
  }

  const raw = await readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<ContribotConfig>;
  const config: ContribotConfig = {
    ...defaultConfig,
    ...parsed,
  };

  validateConfig(config);
  return config;
}

export function validateConfig(config: ContribotConfig): ContribotConfig {
  if (!Array.isArray(config.repos)) {
    throw new Error("Config field `repos` must be an array.");
  }
  if (!Array.isArray(config.labels)) {
    throw new Error("Config field `labels` must be an array.");
  }
  if (!Array.isArray(config.allowNoTests)) {
    throw new Error("Config field `allowNoTests` must be an array.");
  }

  if (config.repos.some((repo) => typeof repo !== "string" || !repo.trim())) {
    throw new Error("Each repo in `repos` must be a non-empty string.");
  }
  if (config.labels.some((label) => typeof label !== "string" || !label.trim())) {
    throw new Error("Each label in `labels` must be a non-empty string.");
  }
  if (config.allowNoTests.some((repo) => typeof repo !== "string" || !repo.trim())) {
    throw new Error("Each repo in `allowNoTests` must be a non-empty string.");
  }

  const numericFields: Array<
    "maxPRsPerRun" | "maxDiffLines" | "maxFilesChanged"
  > = [
    "maxPRsPerRun",
    "maxDiffLines",
    "maxFilesChanged",
  ];
  for (const field of numericFields) {
    const value = config[field];
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`Config field \`${field}\` must be a positive integer.`);
    }
  }

  if (typeof config.safeMode !== "boolean") {
    throw new Error("Config field `safeMode` must be a boolean.");
  }
  if (typeof config.branchPrefix !== "string" || !config.branchPrefix.trim()) {
    throw new Error("Config field `branchPrefix` must be a non-empty string.");
  }
  if (
    typeof config.commitMessageTemplate !== "string" ||
    !config.commitMessageTemplate.trim()
  ) {
    throw new Error("Config field `commitMessageTemplate` must be a non-empty string.");
  }
  if (!["debug", "info", "warn", "error"].includes(config.logLevel)) {
    throw new Error("Config field `logLevel` must be one of debug, info, warn, or error.");
  }

  return config;
}

async function configExists(configPath: string): Promise<boolean> {
  try {
    await access(configPath);
    return true;
  } catch {
    return false;
  }
}
