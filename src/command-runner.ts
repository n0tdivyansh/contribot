import { spawn } from "node:child_process";

import type { CommandResult, CommandRunner } from "./types.js";

export class ShellCommandRunner implements CommandRunner {
  async run(
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv }
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        env: options?.env ?? process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        resolve({
          command,
          args,
          cwd: options?.cwd,
          exitCode: code ?? 1,
          stdout,
          stderr,
        });
      });
    });
  }
}

export function assertCommandSucceeded(result: CommandResult, message: string): void {
  if (result.exitCode !== 0) {
    throw new Error(
      `${message}\nCommand: ${result.command} ${result.args.join(" ")}\n${result.stderr || result.stdout}`
    );
  }
}
