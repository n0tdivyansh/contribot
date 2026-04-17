import { access, readFile } from "node:fs/promises";
import path from "node:path";

import type { ToolchainInfo } from "../types/types.js";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function detectToolchain(repo: string, rootDir: string): Promise<ToolchainInfo> {
  const packageJsonPath = path.join(rootDir, "package.json");
  const pyprojectPath = path.join(rootDir, "pyproject.toml");
  const requirementsPath = path.join(rootDir, "requirements.txt");

  const hasPackageJson = await exists(packageJsonPath);
  const hasPyproject = await exists(pyprojectPath);
  const hasRequirements = await exists(requirementsPath);

  if (hasPackageJson) {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    const scripts = packageJson.scripts ?? {};
    const dependencyNames = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ];

    const packageManager = (await exists(path.join(rootDir, "pnpm-lock.yaml")))
      ? "pnpm"
      : (await exists(path.join(rootDir, "yarn.lock")))
        ? "yarn"
        : "npm";

    return {
      repo,
      rootDir,
      ecosystem: "node",
      packageManager,
      hasFormatter:
        hasScript(scripts, ["format", "prettier"]) ||
        dependencyNames.some((dep) => dep.includes("prettier")),
      hasLinter:
        hasScript(scripts, ["lint"]) ||
        dependencyNames.some((dep) => dep === "eslint" || dep === "xo"),
      hasTests: hasScript(scripts, ["test"]),
      hasBuild: hasScript(scripts, ["build"]),
      hasPinnedPythonTools: false,
      supportsDependencyUpdates: true,
    };
  }

  if (hasPyproject || hasRequirements) {
    const pyproject = hasPyproject ? await readFile(pyprojectPath, "utf8") : "";
    const requirements = hasRequirements ? await readFile(requirementsPath, "utf8") : "";
    const text = `${pyproject}\n${requirements}`;
    return {
      repo,
      rootDir,
      ecosystem: "python",
      hasFormatter: /\bblack\b|\bruff format\b|\bautopep8\b/i.test(text),
      hasLinter: /\bruff\b|\bflake8\b/i.test(text),
      hasTests: /\bpytest\b/i.test(text),
      hasBuild: false,
      hasPinnedPythonTools: /(black|ruff|flake8|pytest)\s*([=<>!~]{1,2})/i.test(text),
      supportsDependencyUpdates: false,
    };
  }

  return {
    repo,
    rootDir,
    ecosystem: "unknown",
    hasFormatter: false,
    hasLinter: false,
    hasTests: false,
    hasBuild: false,
    hasPinnedPythonTools: false,
    supportsDependencyUpdates: false,
  };
}

function hasScript(scripts: Record<string, string>, names: string[]): boolean {
  return Object.keys(scripts).some((name) => names.some((prefix) => name.includes(prefix)));
}
