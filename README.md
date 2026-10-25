# Economic Board Game — implementation

Implementation repository for the multiplayer economic board game. **Status: bootstrap, no game rules implemented.**

## Repository ownership

- [Economic board game knowledge](https://github.com/Daniil-33/economic-board-game) is the **private** source of truth for product rules, balance, gameplay decisions and their approval status.
- This repository owns **technical specifications, application code, infrastructure, tests and agent workflows**.
- `knowledge.lock.json` pins the upstream reference read by specs. A pinned document is **not** automatically approved for implementation.
- Do not mirror private upstream documents into this public repo, public CI logs, issue discussions or agent prompts.

## Workflow

`main` is the intended protected integration branch. Create `feature/*`, `fix/*` or `chore/*` from current `main`; propose small pull requests with traceable specs and evidence. Never self-merge an AI-authored change. See [engineering workflow](docs/workflow.md), [agent instructions](AGENTS.md), and [GitHub protection setup](docs/infrastructure/github-settings.md).

## Layout

- `apps/web` — Vue 3 browser app (not yet installed).
- `apps/server` — authoritative Node.js service (not yet installed).
- `packages/game-core` — deterministic rules engine, **must not depend on server/UI**.
- `packages/protocol` — versioned commands/events/viewer DTOs.
- `packages/test-utils` — deterministic fixtures and game scenarios.
- `infra/` — local/dev/deployment infrastructure, staged after service decisions.
- `specs/` — reviewed technical feature specs, plans and tasks.
- `.agents/skills/` — project-specific repeatable agent procedures.

## Bootstrap check

Requires Node.js 24 and pnpm 10.34.7. Run:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

Dependency versions are pinned with the committed `pnpm-lock.yaml`; CI uses `pnpm install --frozen-lockfile`.

No runtime deployment or external MCP secret configuration is provided by this PR.
