# Releasing Contribot

This document defines the release flow for maintainers.

## Release Types

- Patch: bug fixes, docs fixes, safer heuristics, non-breaking tooling updates
- Minor: new CLI commands, new safe strategies, new supported ecosystems, non-breaking UX improvements
- Major: breaking config changes, breaking CLI changes, or changes to default safety behavior

## Pre-Release Checklist

1. Make sure the branch is green in CI.
2. Update the version in `package.json`.
3. Move notable changes from `## Unreleased` into a new version section in `CHANGELOG.md`.
4. Run:

```bash
npm install
npm run release:check
```

5. Verify the CLI still starts:

```bash
node dist/cli.js --help
```

## Create a Release

From the release commit:

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

## Automated Release Behavior

When a tag matching `v*` is pushed:

1. GitHub Actions runs build, tests, and packaging checks.
2. A release tarball is generated with `npm pack`.
3. A GitHub Release is created automatically with notes from the matching `CHANGELOG.md` section when available.
4. If `NPM_TOKEN` is configured in GitHub Actions secrets, the package is published to npm.

## Required Repository Secrets

- `NPM_TOKEN`
  - Required only if you want automatic npm publishing.
  - Should be an npm automation token with publish access to the package.

## Rollback Guidance

- If a GitHub Release is wrong but npm was not published, delete the tag and create a corrected release.
- If npm publish already happened, publish a new patch release. Do not overwrite an existing npm version.

## Notes

- Use semver consistently.
- Keep alpha/beta labels in release notes when the product is still stabilizing.
- Do not ship breaking safety behavior silently; call it out explicitly in the changelog.
