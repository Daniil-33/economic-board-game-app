# PR-002: private knowledge integration

**Scope:** traceability, read-only metadata checks, and Draft technical-spec scaffolding. No game behavior implementation or autonomous review bot in this PR.

## Authority and confidentiality

- Source repository: Daniil-33/economic-board-game, PRIVATE; product mechanics, statuses, balance and business decisions.
- Implementation repository: Daniil-33/economic-board-game-app, PUBLIC; technical specs, source code, infrastructure and agent review checks.
- The knowledge.lock.json commit identifies one reproducible source revision. Locking to a commit does NOT approve documents marked Draft or Proposed. Do not unilaterally advance the SHA.
- Public CI cannot access source credentials. Never copy private product documents, private MCP responses or credentials into implementation files, logs, artifacts or PR comments.

## Read-only verification

Offline (runs in public PR CI):

    pnpm run knowledge:status

This validates the lock structure ONLY; it cannot prove private source access, document status or branch freshness.

In a **trusted developer/agent environment**, inject a fine-grained GitHub token from a secret manager (not a checked-in env file), restricted to the knowledge repository and Contents: Read-only:

    pnpm run knowledge:verify
    node scripts/knowledge-status.mjs --online --path docs/decisions/0001-engine-boundaries.md

The first command fetches only GitHub metadata: the pinned commit and the design branch head. If the branch HEAD has changed, it prints STALE and exits with code 2; no lock changes are made. The second command privately reads the document at the pinned SHA, parses its explicit status header, and prints only status metadata, never the document text. Missing token or insufficient access makes the command fail closed.

This metadata check is not a substitute for a trusted agent reading and interpreting the relevant approved product rules. A file with unknown/proposed/draft status is not approved merely because it contains a phrase such as user-confirmed.

## Create a Draft technical specification

    pnpm run spec:new -- --slug 001-game-engine --source docs/decisions/0001-engine-boundaries.md --source docs/architecture/engine-contract.md

Creates four Draft files in a new directory:
- specs/001-game-engine/spec.md
- specs/001-game-engine/plan.md
- specs/001-game-engine/tasks.md
- specs/001-game-engine/provenance.json

Every file is intentionally only a starter. Provenance records the pinned SHA and source paths (metadata), with approvedForImplementation=false and sourceStatuses=UNVERIFIED. No source document text is copied, no implementation is authorized and existing spec directories cannot be overwritten by the command.

In a private agent session, inspect the actual source documents at the pinned SHA using GitHub MCP read-only tools. Identify which requirements are Accepted vs Draft/Proposed and any conflicts. Write original, public-safe technical requirements rather than copying private paragraphs into this public implementation repository; obtain human approval before implementing.

## MCP privileges

See docs/infrastructure/mcp.md. Separate source-reader permission from implementation-writer permission. Public pull_request checks never get the private source token; reviewers must sanitize any cross-repository citations.

## Next PR

PR-003 will be agentic review orchestration (architecture, rule conformity, correctness, performance, security and code style), plus actual installed Spec Kit / Beads / MCP configuration once reviewed. These tools are NOT installed or running by this PR.
