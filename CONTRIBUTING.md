# Contributing

Thanks for contributing to Contribot.

## Local Setup

```bash
npm install
npm run check
```

## Development Expectations

- Keep the tool conservative. Prefer skipping risky work over widening automation.
- Do not add AI-editing behavior to safe-mode paths.
- Preserve dry-run-first behavior unless a change explicitly targets publish flow.
- Add tests for any new heuristics, validation rules, or CLI behavior.

## Pull Requests

- Describe the user-facing change clearly.
- Include test coverage or explain why tests are not practical.
- Call out any behavior that changes safety constraints or publishing behavior.

## Release Notes

Use semver and document user-visible changes in the release description.
