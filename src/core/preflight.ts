import type { CommandRunner, PreflightCheck } from "../types/types.js";

export async function runPreflightChecks(
  runner: CommandRunner,
  options: { requireGit?: boolean; requireGh?: boolean; requireGitHubAuth?: boolean; requirePython?: boolean }
): Promise<PreflightCheck[]> {
  const checks: PreflightCheck[] = [];

  if (options.requireGit) {
    checks.push(await checkCommand(runner, "git", ["--version"], "git is available"));
  }
  if (options.requireGh) {
    checks.push(await checkCommand(runner, "gh", ["--version"], "GitHub CLI is available"));
  }
  if (options.requireGitHubAuth) {
    checks.push(await checkCommand(runner, "gh", ["auth", "status"], "GitHub CLI auth is configured"));
  }
  if (options.requirePython) {
    checks.push(await checkOptionalCommand(runner, "python", ["--version"], "python is available for Python repos"));
  }

  return checks;
}

export function assertPreflight(checks: PreflightCheck[]): void {
  const failures = checks.filter((check) => !check.ok);
  if (failures.length === 0) {
    return;
  }
  const lines = failures.map((check) => `- ${check.name}: ${check.message}`).join("\n");
  throw new Error(`Preflight checks failed:\n${lines}`);
}

async function checkCommand(
  runner: CommandRunner,
  command: string,
  args: string[],
  okMessage: string
): Promise<PreflightCheck> {
  try {
    const result = await runner.run(command, args);
    return {
      name: command,
      ok: result.exitCode === 0,
      message: result.exitCode === 0 ? okMessage : (result.stderr.trim() || result.stdout.trim() || `${command} failed`),
    };
  } catch (error) {
    return {
      name: command,
      ok: false,
      message: error instanceof Error ? error.message : `${command} is unavailable`,
    };
  }
}

async function checkOptionalCommand(
  runner: CommandRunner,
  command: string,
  args: string[],
  okMessage: string
): Promise<PreflightCheck> {
  try {
    const result = await runner.run(command, args);
    return {
      name: command,
      ok: result.exitCode === 0,
      message: result.exitCode === 0 ? okMessage : `${command} not available`,
    };
  } catch {
    return {
      name: command,
      ok: true,
      message: `${command} not available; Node-only repositories can still work`,
    };
  }
}
