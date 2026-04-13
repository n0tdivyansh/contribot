import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CommandResult, CommandRunner, SafeStrategy, ToolchainInfo } from "./types.js";

export async function applySafeFix(
  runner: CommandRunner,
  toolchain: ToolchainInfo,
  strategy: SafeStrategy
): Promise<CommandResult[]> {
  if (strategy === "skip") {
    return [];
  }

  if (toolchain.ecosystem === "node") {
    return runNodeFix(runner, toolchain, strategy);
  }
  if (toolchain.ecosystem === "python") {
    return runPythonFix(runner, toolchain, strategy);
  }
  if (strategy === "text-cleanup") {
    await applyTextCleanup(toolchain.rootDir);
    return [];
  }

  throw new Error(`Unsupported ecosystem for strategy ${strategy}.`);
}

async function runNodeFix(
  runner: CommandRunner,
  toolchain: ToolchainInfo,
  strategy: SafeStrategy
): Promise<CommandResult[]> {
  const packageJsonPath = path.join(toolchain.rootDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};
  const packageManager = toolchain.packageManager ?? "npm";
  const commands: CommandResult[] = [];

  if (strategy === "lint-fix") {
    const lintScript = findScript(scripts, ["lint:fix", "lint"]);
    if (!lintScript) {
      throw new Error("No supported lint autofix script found.");
    }
    commands.push(await runPackageScript(runner, packageManager, lintScript, toolchain.rootDir));
    return commands;
  }

  if (strategy === "format-fix") {
    const formatScript = findScript(scripts, ["format", "prettier"]);
    if (!formatScript) {
      throw new Error("No supported formatting script found.");
    }
    commands.push(await runPackageScript(runner, packageManager, formatScript, toolchain.rootDir));
    return commands;
  }

  if (strategy === "dependency-update") {
    const args =
      packageManager === "yarn" ? ["upgrade"] : packageManager === "pnpm" ? ["update"] : ["update"];
    commands.push(await runner.run(packageManager, args, { cwd: toolchain.rootDir }));
    return commands;
  }

  if (strategy === "text-cleanup") {
    await applyTextCleanup(toolchain.rootDir);
    return commands;
  }

  return commands;
}

async function runPythonFix(
  runner: CommandRunner,
  toolchain: ToolchainInfo,
  strategy: SafeStrategy
): Promise<CommandResult[]> {
  if (!toolchain.hasPinnedPythonTools) {
    throw new Error("Python repo does not declare pinned formatter/linter tooling.");
  }

  const commands: CommandResult[] = [];
  if (strategy === "lint-fix" && toolchain.hasLinter) {
    commands.push(await runner.run("python", ["-m", "ruff", "check", ".", "--fix"], { cwd: toolchain.rootDir }));
    return commands;
  }
  if (strategy === "format-fix" && toolchain.hasFormatter) {
    commands.push(await runner.run("python", ["-m", "black", "."], { cwd: toolchain.rootDir }));
    return commands;
  }
  if (strategy === "text-cleanup") {
    await applyTextCleanup(toolchain.rootDir);
    return commands;
  }

  throw new Error(`Unsupported Python strategy ${strategy}.`);
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
      : packageManager === "pnpm"
        ? ["run", scriptName]
        : ["run", scriptName];
  return runner.run(packageManager, args, { cwd });
}

function findScript(scripts: Record<string, string>, candidates: string[]): string | undefined {
  return candidates.find((candidate) => candidate in scripts) ?? Object.keys(scripts).find((name) => {
    return candidates.some((candidate) => name.includes(candidate));
  });
}

async function applyTextCleanup(rootDir: string): Promise<void> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const candidate = entries.find((entry) => entry.isFile() && /^readme/i.test(entry.name));
  if (!candidate) {
    return;
  }

  const filePath = path.join(rootDir, candidate.name);
  const contents = await readFile(filePath, "utf8");
  const cleaned = contents
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  if (cleaned !== contents) {
    await writeFile(filePath, cleaned, "utf8");
  }
}
