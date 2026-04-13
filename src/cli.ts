#!/usr/bin/env node

import { Command } from "commander";

import { ShellCommandRunner } from "./command-runner.js";
import { loadConfig } from "./config.js";
import { initConfig } from "./init.js";
import { runBatch, runFix, runScan } from "./orchestrator.js";
import { assertPreflight, runPreflightChecks } from "./preflight.js";

const program = new Command();

program
  .name("ai-contributor")
  .description("Safe-only GitHub contributor agent MVP")
  .option("-c, --config <path>", "Path to config file")
  .option("--publish", "Push branch and create a pull request")
  .option("--debug", "Keep temporary workspaces on disk for inspection");

program
  .command("init")
  .description("Create a starter AICA config file")
  .option("-c, --config <path>", "Path to write the config file")
  .option("--force", "Overwrite an existing config file")
  .action(async (commandOptions: { config?: string; force?: boolean }) => {
    const configPath = await initConfig({
      configPath: commandOptions.config,
      force: Boolean(commandOptions.force),
    });
    console.log(`Created config at ${configPath}`);
  });

program
  .command("doctor")
  .description("Run environment and auth preflight checks")
  .action(async () => {
    const runner = new ShellCommandRunner();
    const checks = await runPreflightChecks(runner, {
      requireGit: true,
      requireGh: true,
      requireGitHubAuth: true,
      requirePython: true,
    });
    console.log(JSON.stringify({ checks }, null, 2));
    if (checks.some((check) => !check.ok)) {
      process.exitCode = 1;
    }
  });

program
  .command("scan")
  .description("Scan a repository for safe automatable issues")
  .argument("<ownerRepo>", "GitHub repository in owner/repo format")
  .action(async (ownerRepo: string) => {
    const options = program.opts<{ config?: string; publish?: boolean; debug?: boolean }>();
    const config = await loadConfig(options.config);
    const runner = new ShellCommandRunner();
    const checks = await runPreflightChecks(runner, {
      requireGit: false,
      requireGh: true,
      requireGitHubAuth: true,
      requirePython: false,
    });
    assertPreflight(checks);
    const { logPath, scanResults } = await runScan(runner, config, ownerRepo, {
      configPath: options.config,
      publish: Boolean(options.publish),
      debug: Boolean(options.debug),
    });
    console.log(JSON.stringify({ scanResults, logPath }, null, 2));
  });

program
  .command("fix")
  .description("Apply a safe fix to a single repository")
  .argument("<ownerRepo>", "GitHub repository in owner/repo format")
  .action(async (ownerRepo: string) => {
    const options = program.opts<{ config?: string; publish?: boolean; debug?: boolean }>();
    const config = await loadConfig(options.config);
    const runner = new ShellCommandRunner();
    const checks = await runPreflightChecks(runner, {
      requireGit: true,
      requireGh: true,
      requireGitHubAuth: true,
      requirePython: true,
    });
    assertPreflight(checks);
    const { logPath, result } = await runFix(runner, config, ownerRepo, {
      configPath: options.config,
      publish: Boolean(options.publish),
      debug: Boolean(options.debug),
    });
    console.log(JSON.stringify({ result, logPath }, null, 2));
    process.exitCode = result.status === "failed" ? 1 : 0;
  });

program.command("run").description("Run the safe contribution loop across configured repositories").action(async () => {
  const options = program.opts<{ config?: string; publish?: boolean; debug?: boolean }>();
  const config = await loadConfig(options.config);
  const runner = new ShellCommandRunner();
  const checks = await runPreflightChecks(runner, {
    requireGit: true,
    requireGh: true,
    requireGitHubAuth: true,
    requirePython: true,
  });
  assertPreflight(checks);
  const { logPath, results } = await runBatch(runner, config, {
    configPath: options.config,
    publish: Boolean(options.publish),
    debug: Boolean(options.debug),
  });
  console.log(JSON.stringify({ results, logPath }, null, 2));
  process.exitCode = results.some((result) => result.status === "failed") ? 1 : 0;
});

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
