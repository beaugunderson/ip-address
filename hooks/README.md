# Commit checks

`npm run docs:check` renders the API reference in memory and compares it with
`README.md`. It writes nothing and fails with the regeneration command when the
README is stale. CI and `hooks/pre-commit` use the same check.

The hook refuses unstaged changes to documentation inputs before checking them:
`src/`, `scripts/`, `README.md`, `tsconfig.json`, `package.json`, and the lockfile.
Stage the intended source and regenerated README together. The hook never
regenerates, stages, stashes, or discards user edits.

Run `npm run docs` explicitly to update the README. The fixture-based tests in
`test/docs-check-test.ts` exercise stale/current output and partial staging
without modifying the real repository's index or README.
