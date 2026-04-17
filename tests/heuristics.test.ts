import { describe, expect, it } from "vitest";

import { isAutomatableIssue, scoreIssue, selectStrategy } from "../src/core/heuristics.js";
import type { RepoIssue, ToolchainInfo } from "../src/types/types.js";

const baseIssue: RepoIssue = {
  number: 12,
  title: "Fix lint warnings in src",
  body: "Several eslint warnings can be autofixed.",
  labels: ["bug"],
  updatedAt: new Date().toISOString(),
  url: "https://github.com/acme/repo/issues/12",
};

const nodeToolchain: ToolchainInfo = {
  repo: "acme/repo",
  rootDir: "/tmp/repo",
  ecosystem: "node",
  packageManager: "npm",
  hasFormatter: true,
  hasLinter: true,
  hasTests: true,
  hasBuild: true,
  hasPinnedPythonTools: false,
  supportsDependencyUpdates: true,
};

describe("heuristics", () => {
  it("accepts safe labeled issues", () => {
    expect(isAutomatableIssue(baseIssue, ["bug"])).toBe(true);
  });

  it("rejects risky issues", () => {
    expect(
      isAutomatableIssue(
        {
          ...baseIssue,
          title: "Feature proposal: redesign architecture",
        },
        ["bug"]
      )
    ).toBe(false);
  });

  it("scores lint issues higher than zero", () => {
    expect(scoreIssue(baseIssue).score).toBeGreaterThan(0);
  });

  it("selects lint strategy when supported", () => {
    expect(selectStrategy(baseIssue, nodeToolchain)).toBe("lint-fix");
  });
});
