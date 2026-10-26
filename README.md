# Economic Board Game — implementation

Implementation and infrastructure repository for the multiplayer economic board game. **Current status: tooling bootstrap, no game behavior implemented.**

## Ownership

- Separate private source of truth: Daniil-33/economic-board-game (gameplay, economic rules, product decisions).
- This PUBLIC repository: technical specs, code, infrastructure, testing and agent workflows.
- The exact upstream version is pinned in knowledge.lock.json. A pinned Draft is NOT an approved rule. Never copy raw private source text to this repository, public CI artifacts or comments.
- See docs/knowledge-integration.md and docs/infrastructure/mcp.md.

## Commands

Requires Node.js 24 and pnpm 10.34.7 with the committed lockfile.

    corepack enable
    pnpm install --frozen-lockfile
    pnpm run check
    pnpm run knowledge:status
    pnpm run knowledge:verify
    pnpm run spec:new -- --slug 001-game-engine --source docs/decisions/0001-engine-boundaries.md

knowledge:status is OFFLINE and does not query upstream. knowledge:verify requires KNOWLEDGE_REPO_READ_TOKEN in a TRUSTED private environment, with read-only permission on the private knowledge repository. Public CI does not receive this token.

spec:new generates only Draft spec/plan/tasks/provenance; human approval is required before implementation.

## Workspace

- apps/web: placeholder for Vue browser client (not installed yet).
- apps/server: placeholder for authoritative Node server.
- packages/game-core: placeholder for deterministic pure TypeScript engine.
- packages/protocol: placeholder for typed commands/events/DTOs.
- packages/test-utils: placeholder for deterministic fixtures.
- infra: staged local development and deployment.
- specs: technical specs and traceability metadata.
- .agents/skills: documented procedures, not self-running agent services.

## Workflow

Work in feature/fix/chore branches from main. All changes go through PRs; no direct agent merges. See AGENTS.md, docs/workflow.md and docs/reviews/axes.md. Branch protection must be configured by the repo administrator separately. Automated multi-axis LLM reviews are planned for PR-003 and are not yet running.
