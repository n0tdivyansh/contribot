import { createEvent, RunLogger } from "./logger.js";
import { scanRepository } from "./scanner.js";
import { createWorkspace, cleanupWorkspace } from "./workspace.js";
import { detectToolchain } from "./toolchain.js";
import { selectStrategy } from "./heuristics.js";
import { applySafeFix } from "./fix-engine.js";
import { validateWorkspace } from "./validator.js";
import { publishPullRequest } from "./publisher.js";
import type { AicaConfig, CliOptions, CommandRunner, RepoRunResult, ScanResult } from "./types.js";

export async function runScan(
  runner: CommandRunner,
  config: AicaConfig,
  repo: string | undefined,
  options: CliOptions
): Promise<{ logPath: string; scanResults: ScanResult[] }> {
  const logger = new RunLogger("scan", options.publish, config.logLevel);
  const repos = repo ? [repo] : config.repos;
  const scanResults: ScanResult[] = [];

  for (const targetRepo of repos) {
    logger.log(createEvent("info", "scan", "Scanning repository for safe issues.", targetRepo));
    const result = await scanRepository(runner, targetRepo, config.labels);
    scanResults.push(result);
    logger.pushResult({
      repo: targetRepo,
      status: result.skippedReason ? "skipped" : "success",
      failureReason: result.skippedReason,
    });
  }

  const logPath = await logger.flush();
  return { logPath, scanResults };
}

export async function runFix(
  runner: CommandRunner,
  config: AicaConfig,
  repo: string,
  options: CliOptions
): Promise<{ logPath: string; result: RepoRunResult }> {
  const logger = new RunLogger("fix", options.publish, config.logLevel);
  const result = await processRepository(runner, config, repo, options, logger);
  logger.pushResult(result);
  const logPath = await logger.flush();
  return { logPath, result };
}

export async function runBatch(
  runner: CommandRunner,
  config: AicaConfig,
  options: CliOptions
): Promise<{ logPath: string; results: RepoRunResult[] }> {
  const logger = new RunLogger("run", options.publish, config.logLevel);
  const results: RepoRunResult[] = [];
  const repos = config.repos.slice(0, config.maxPRsPerRun);

  for (const repo of repos) {
    const result = await processRepository(runner, config, repo, options, logger);
    results.push(result);
    logger.pushResult(result);
  }

  const logPath = await logger.flush();
  return { logPath, results };
}

async function processRepository(
  runner: CommandRunner,
  config: AicaConfig,
  repo: string,
  options: CliOptions,
  logger: RunLogger
): Promise<RepoRunResult> {
  logger.log(createEvent("info", "scan", "Scanning repository for candidate issues.", repo));
  const scan = await scanRepository(runner, repo, config.labels);
  if (scan.skippedReason) {
    logger.log(createEvent("warn", "skip", scan.skippedReason, repo));
    return { repo, status: "skipped", failureReason: scan.skippedReason };
  }
  const issue = scan.issues[0];
  if (!issue) {
    logger.log(createEvent("warn", "skip", "No safe issues found.", repo));
    return { repo, status: "skipped", failureReason: "No safe issues found." };
  }

  let workspacePath: string | undefined;
  let workspaceTempDir: string | undefined;
  try {
    const workspace = await createWorkspace(runner, repo, config.branchPrefix, "scan", issue.number);
    workspacePath = workspace.repoDir;
    workspaceTempDir = workspace.tempDir;
    const toolchain = await detectToolchain(repo, workspace.repoDir);
    if (toolchain.ecosystem === "unknown") {
      return { repo, status: "skipped", issue, failureReason: "Unsupported repository ecosystem.", workspacePath };
    }

    const strategy = selectStrategy(issue, toolchain);
    logger.log(createEvent("info", "selection", `Selected strategy ${strategy}.`, repo, { issue: issue.number }));
    if (strategy === "skip") {
      return { repo, status: "skipped", issue, selectedStrategy: strategy, failureReason: "No safe strategy matched.", workspacePath };
    }

    workspace.branchName = `${config.branchPrefix}/${strategy}/${issue.number}`;
    await runner.run("git", ["branch", "-M", workspace.branchName], { cwd: workspace.repoDir });

    const fixCommands = await applySafeFix(runner, toolchain, strategy);
    const failedFix = fixCommands.find((command) => command.exitCode !== 0);
    if (failedFix) {
      throw new Error(`Fix command failed: ${failedFix.command} ${failedFix.args.join(" ")}`);
    }
    logger.log(createEvent("info", "fix", "Applied safe fix commands.", repo, { commands: fixCommands.length }));

    const validation = await validateWorkspace(runner, config, toolchain, strategy);
    logger.log(createEvent(validation.ok ? "info" : "warn", "validation", validation.reason, repo));
    if (!validation.ok) {
      return {
        repo,
        status: "failed",
        issue,
        selectedStrategy: strategy,
        validation,
        failureReason: validation.reason,
        workspacePath,
      };
    }

    let prUrl: string | undefined;
    if (options.publish) {
      prUrl = await publishPullRequest(
        runner,
        workspace.repoDir,
        repo,
        workspace.branchName,
        config.commitMessageTemplate,
        issue,
        strategy,
        validation
      );
      logger.log(createEvent("info", "publish", "Opened pull request.", repo, { prUrl }));
    } else {
      logger.log(createEvent("info", "publish", "Dry run complete; PR publishing disabled.", repo));
    }

    return {
      repo,
      status: "success",
      issue,
      selectedStrategy: strategy,
      validation,
      branch: workspace.branchName,
      prUrl,
      workspacePath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    logger.log(createEvent("error", "failure", message, repo));
    return {
      repo,
      status: "failed",
      issue,
      failureReason: message,
      workspacePath,
    };
  } finally {
    if (workspaceTempDir) {
      await cleanupWorkspace(workspaceTempDir, options.debug);
    }
  }
}
