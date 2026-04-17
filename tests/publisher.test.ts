import { describe, expect, it } from "vitest";

import { buildPrBody } from "../src/integrations/github/publisher.js";
import type { RepoIssue, ValidationResult } from "../src/types/types.js";

describe("buildPrBody", () => {
  it("renders issue and validation details", () => {
    const issue: RepoIssue = {
      number: 7,
      title: "Format docs",
      body: "",
      labels: ["good first issue"],
      updatedAt: new Date().toISOString(),
      url: "https://github.com/acme/repo/issues/7",
    };
    const validation: ValidationResult = {
      ok: true,
      reason: "Validation passed.",
      commands: [
        {
          command: "npm",
          args: ["run", "test"],
          exitCode: 0,
          stdout: "",
          stderr: "",
        },
      ],
    };

    const body = buildPrBody(issue, "format-fix", validation);
    expect(body).toContain("issue #7");
    expect(body).toContain("format-fix");
    expect(body).toContain("npm run test");
  });
});
