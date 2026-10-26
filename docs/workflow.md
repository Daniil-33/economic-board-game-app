# Agentic engineering workflow

## Authority
- Product knowledge stays in the separate PRIVATE economic-board-game repository.
- Technical specs, tests, code and infrastructure live in this PUBLIC implementation repository.
- knowledge.lock.json pins an immutable product-source revision but does not imply approval of drafts.

## Feature lifecycle
1. Check upstream pin OFFLINE with pnpm run knowledge:status; in approved private context, use pnpm run knowledge:verify to check live GitHub source/ref metadata.
2. At the pinned commit, privately read only the needed product docs with read-only GitHub MCP. Verify explicit Accepted/Approved vs Draft/Proposed statuses and conflicting decisions.
3. Generate a Draft technical spec via pnpm run spec:new and author original acceptance scenarios, constraints and non-goals without private source quotations in public files.
4. Seek human approval for any game rules and architectural decisions; agents may not grant authorization to themselves.
5. Implement only approved features in small branches from main, with deterministic tests and tracked source provenance.
6. CI runs safe deterministic/offline quality checks without access to private source secrets: formatting, ESLint, tracked-secret scanning, provenance, typecheck and tests. LLM review is a separate manual local action and is not invoked by public CI.
7. Resolve review blockers and rerun checks on changed head SHAs. Only human-authorized merge.
8. If source rules need to change, propose a reviewable knowledge-repo change; implementation agents cannot silently alter normative rules.

## Delivered versus planned
PR-001: repository skeleton and CI.
PR-002: private read-only provenance checks, Draft spec scaffold and safe skills.
PR-003 is phased: deterministic GitHub quality gates are implemented first; local manual multi-axis review remains separate. Autonomous subworker orchestration, real MCP config and enforced review gates are deferred. Spec Kit and Beads remain subject to a separate version review.
