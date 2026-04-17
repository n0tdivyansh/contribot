import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  AicaConfig,
  CommandResult,
  CommandRunner,
  DiffStats,
  SafeStrategy,
  ToolchainInfo,
  ValidationResult,
} from "../types/types.js";

export async function validateWorkspace(
  runner: CommandRunner,
  config: AicaConfig,
  toolchain: ToolchainInfo,
  strategy: SafeStrategy
): Promise<ValidationResult> {
  const commands: CommandResult[] = [];

  if (!toolchain.hasTests && !toolchain.hasBuild && !config.allowNoTests.includes(toolchain.repo)) {
    return {
      ok: false,
      reason: "Repository has no recognized test/build validation and is not allowlisted.",
      commands,
    };
  }

  if (toolchain.ecosystem === "node") {
    commands.push(...(await runNodeValidation(runner, toolchain)));
  } else if (toolchain.ecosystem === "python") {
    commands.push(...(await runPythonValidation(runner, toolchain)));
  } else {
    return {
      ok: false,
      reason: "Unsupported ecosystem for validation.",
      commands,
    };
  }

  const failed = commands.find((command) => command.exitCode !== 0);
  if (failed) {
    return {
      ok: false,
      reason: `Validation command failed: ${failed.command} ${failed.args.join(" ")}`,
      commands,
    };
  }

  const diffStats = await collectDiffStats(runner, toolchain.rootDir);
  const diffLines = diffStats.insertions + diffStats.deletions;
  if (diffStats.filesChanged > config.maxFilesChanged) {
    return {
      ok: false,
      reason: `Changed ${diffStats.filesChanged} files, above max ${config.maxFilesChanged}.`,
      commands,
      diffStats,
    };
  }
  if (diffLines > config.maxDiffLines) {
    return {
      ok: false,
      reason: `Changed ${diffLines} lines, above max ${config.maxDiffLines}.`,
      commands,
      diffStats,
    };
  }
  if (diffStats.binaryFiles.length > 0) {
    return {
      ok: false,
      reason: "Binary file changes are not allowed.",
      commands,
      diffStats,
    };
  }
  if (strategy !== "dependency-update" && diffStats.lockfilesChanged.length > 0) {
    return {
      ok: false,
      reason: "Lockfile changes are only allowed for dependency update strategy.",
      commands,
      diffStats,
    };
  }

  return {
    ok: true,
    reason: "Validation passed.",
    commands,
    diffStats,
  };
}

async function runNodeValidation(
  runner: CommandRunner,
  toolchain: ToolchainInfo
): Promise<CommandResult[]> {
  const packageJson = JSON.parse(await readFile(path.join(toolchain.rootDir, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};
  const packageManager = toolchain.packageManager ?? "npm";
  const commands: CommandResult[] = [];

  commands.push(await runner.run(packageManager, packageManager === "yarn" ? ["install", "--immutable"] : ["install"], { cwd: toolchain.rootDir }));

  const buildScript = findScript(scripts, ["build"]);
  if (buildScript) {
    commands.push(await runPackageScript(runner, packageManager, buildScript, toolchain.rootDir));
  }
  const testScript = findScript(scripts, ["test"]);
  if (testScript) {
    commands.push(await runPackageScript(runner, packageManager, testScript, toolchain.rootDir));
  }

  return commands;
}

async function runPythonValidation(
  runner: CommandRunner,
  toolchain: ToolchainInfo
): Promise<CommandResult[]> {
  const commands: CommandResult[] = [];
  if (toolchain.hasTests) {
    commands.push(await runner.run("python", ["-m", "pytest"], { cwd: toolchain.rootDir }));
  }
  return commands;
}

async function runPackageScript(
  runner: CommandRunner,
  packageManager: "npm" | "pnpm" | "yarn",
  scriptName: string,
  cwd: string
): Promise<CommandResult> {
  const args =
    packageManager === "yarn"
      ? [scriptName]
      : ["run", scriptName];
  return runner.run(packageManager, args, { cwd });
}

function findScript(scripts: Record<string, string>, names: string[]): string | undefined {
  return Object.keys(scripts).find((name) => names.some((candidate) => name.includes(candidate)));
}

export async function collectDiffStats(runner: CommandRunner, cwd: string): Promise<DiffStats> {
  const summary = await runner.run("git", ["diff", "--shortstat"], { cwd });
  const numstat = await runner.run("git", ["diff", "--numstat"], { cwd });

  const filesChanged = Number(summary.stdout.match(/(\d+)\s+files? changed/)?.[1] ?? 0);
  const insertions = Number(summary.stdout.match(/(\d+)\s+insertions?\(\+\)/)?.[1] ?? 0);
  const deletions = Number(summary.stdout.match(/(\d+)\s+deletions?\(-\)/)?.[1] ?? 0);
  const binaryFiles: string[] = [];
  const lockfilesChanged: string[] = [];

  for (const line of numstat.stdout.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const [added, removed, file] = line.split("\t");
    if (added === "-" || removed === "-") {
      binaryFiles.push(file);
    }
    if (/package-lock\.json|pnpm-lock\.yaml|yarn\.lock|poetry\.lock/i.test(file)) {
      lockfilesChanged.push(file);
    }
  }

  return {
    filesChanged,
    insertions,
    deletions,
    binaryFiles,
    lockfilesChanged,
  };
}
