# Contribot

Contribot is a safe, configurable CLI for scanning repositories, applying constrained fixes, validating them, and optionally opening pull requests. The current codebase is the foundation for the phased product roadmap, with a conservative safe-mode workflow already implemented and autonomous or AI-assisted modes still planned.

## Current State

- Product name: `Contribot`
- Canonical CLI: `contribot`
- Current implementation focus: safe, validated GitHub contribution workflow
- Planned next direction: phase-by-phase move toward codebase-first scanning, autonomous mode, and constrained AI fixes

## Commands

- `contribot init`
- `contribot doctor`
- `contribot run`
- `contribot scan <owner/repo>`
- `contribot fix <owner/repo>`
- `contribot auto`

## Local Usage

### CLI

```bash
npm install
npm run build
node dist/src/cli/index.js --help
```

### Dashboard

Contribot comes with a real-time web dashboard that reads CLI logs and tracks metrics. Run both servers in separate terminals:

```bash
# Terminal 1: Start the API server (Port 3001)
cd server
npm install
npm run dev

# Terminal 2: Start the frontend (Port 5173)
cd dashboard
npm install
npm run dev
```
## Config

Start from [`contribot.config.example.json`](./contribot.config.example.json) or create one with `contribot init`.

```json
{
  "repos": ["owner/repo"],
  "labels": ["bug", "good first issue"],
  "maxPRsPerRun": 1,
  "safeMode": true,
  "maxDiffLines": 200,
  "maxFilesChanged": 10,
  "branchPrefix": "contribot",
  "commitMessageTemplate": "chore: apply safe automated fix",
  "logLevel": "info",
  "allowNoTests": []
}
```

## Notes

- `run`, `scan`, and `fix` are implemented in the main TypeScript CLI.
- `auto` is currently a placeholder command.
- The repo still contains foundational internals built during the earlier MVP phase, but the public identity and command surface are now standardized around Contribot.

## Release Flow

See [RELEASING.md](./RELEASING.md) for the release process.
