# AICA

AICA is a conservative open-source CLI for making small, deterministic GitHub contributions. It scans user-approved repositories for low-risk issues, applies allowlisted fixes, validates the result locally, and can optionally open a pull request with GitHub CLI.

The current release is intentionally narrow:

- Safe-mode only
- No AI-generated edits
- No built-in scheduler
- No WhatsApp delivery yet
- Best support for Node.js and Python repositories with recognizable tooling

## Why AICA

AICA is built for contributors who want repeatable, observable open-source activity without handing control to a black-box agent. The tool favors skipping risky work over attempting clever fixes.

## Install

```bash
npm install -g ai-github-contributor-agent
```

If you are working from source:

```bash
npm install
npm run build
node dist/cli.js --help
```

## Requirements

- Node.js 20+
- `git`
- GitHub CLI (`gh`)
- `gh auth login` completed
- Python available if you want to support Python repositories

## Quick Start

```bash
ai-contributor init
ai-contributor doctor
ai-contributor scan owner/repo
ai-contributor fix owner/repo --debug
```

When you are comfortable with the dry run results:

```bash
ai-contributor fix owner/repo --publish
```

## Commands

### `ai-contributor init`

Creates a starter `aica.config.json` in the current directory.

### `ai-contributor doctor`

Runs environment preflight checks for `git`, `gh`, GitHub auth, and optional Python support.

### `ai-contributor scan <owner/repo>`

Queries GitHub issues and ranks issues that look safe and automatable.

### `ai-contributor fix <owner/repo>`

Clones the repository into a temporary workspace, picks the top safe issue, applies a deterministic fix, validates the result, and reports what happened. By default this is a dry run.

### `ai-contributor run`

Runs the same flow across repositories listed in the config, limited by `maxPRsPerRun`.

## Configuration

Start from [`aica.config.example.json`](./aica.config.example.json) or generate one with `ai-contributor init`.

```json
{
  "repos": ["owner/repo"],
  "labels": ["bug", "good first issue"],
  "maxPRsPerRun": 1,
  "safeMode": true,
  "maxDiffLines": 200,
  "maxFilesChanged": 10,
  "branchPrefix": "aica",
  "commitMessageTemplate": "chore: apply safe automated fix",
  "logLevel": "info",
  "allowNoTests": []
}
```

## Safety Model

AICA is intentionally conservative:

- Repositories must be explicitly provided or allowlisted in config
- Only deterministic strategies are attempted
- Risky issues are skipped by heuristic
- Validation runs before any PR is created
- Binary changes are blocked
- Lockfile changes are only allowed for dependency-update strategy
- Dry run is the default

## Supported Fix Types

- Linter autofix when supported scripts or tools are present
- Formatter runs when supported scripts or tools are present
- Constrained dependency updates
- Small text cleanup in repository docs

## Logs

Every run writes a structured JSON log to `logs/run-<timestamp>.json`.

## Development

```bash
npm install
npm run check
npm run pack:dry
```

## Release Flow

See [RELEASING.md](./RELEASING.md) for the maintainer release process.

Release automation is tag-driven:

- update `package.json` version
- add the matching section in `CHANGELOG.md`
- create and push a git tag like `v0.1.1`
- GitHub Actions will validate the package and create a GitHub Release
- npm publish will run automatically if `NPM_TOKEN` is configured in repository secrets

## Status

This project is release-ready as an alpha, not production-perfect. Expect conservative skipping, limited ecosystem support, and iterative hardening based on real repository testing.

## License

MIT. See [LICENSE](./LICENSE).
