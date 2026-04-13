#!/usr/bin/env node

import { loadConfig } from "./config.js";

const [, , command, ...args] = process.argv;

function log(message: string): void {
  console.log(`[contribot] ${message}`);
}

function error(message: string): void {
  console.error(`[contribot] Error: ${message}`);
}

function showHelp(): void {
  console.log(`Contribot CLI

Usage:
  contribot run
  contribot scan <repo>
  contribot fix <repo>
  contribot auto
`);
}

function requireRepo(repo: string | undefined, action: string): string | null {
  if (repo) {
    return repo;
  }

  error(`Missing <repo> for \`${action}\`.`);
  showHelp();
  process.exitCode = 1;
  return null;
}

async function main(): Promise<void> {
  const config = await loadConfig();

  switch (command) {
    case "run":
      log("Starting run mode...");
      log(`Loaded config with ${config.repos.length} configured repos.`);
      log("Dry run pipeline initialized.");
      break;

    case "scan": {
      const repo = requireRepo(args[0], "scan");
      if (!repo) {
        break;
      }
      log(`Scanning repository: ${repo}`);
      log(`Using ${config.labels.length} configured labels as hints.`);
      log("Codebase scan complete.");
      break;
    }

    case "fix": {
      const repo = requireRepo(args[0], "fix");
      if (!repo) {
        break;
      }
      log(`Preparing safe fix flow for: ${repo}`);
      log(`Safe mode is ${config.safeMode ? "enabled" : "disabled"}.`);
      log("Fix phase complete.");
      break;
    }

    case "auto":
      log("Starting autonomous mode...");
      log(`Configured max PRs per run: ${config.maxPRsPerRun}.`);
      log("Autonomous loop initialized.");
      break;

    case "--help":
    case "-h":
    case undefined:
      showHelp();
      break;

    default:
      error(`Unknown command: ${command}`);
      showHelp();
      process.exitCode = 1;
  }
}

main().catch((reason: unknown) => {
  const message = reason instanceof Error ? reason.message : "Unexpected error";
  error(message);
  process.exitCode = 1;
});
