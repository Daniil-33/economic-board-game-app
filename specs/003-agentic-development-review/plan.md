# PR-003 implementation plan

Status: APPROVED implementation plan for the discussed PR-003 infrastructure scope.

## Proposed structure

After human acceptance, create a feature branch from current main. Proposed locations (not created by this draft): `scripts/review/` for coordinator, snapshot, schema validation, aggregation and adapters; `.agents/reviewers/` for six role definitions; versioned public fixtures under `scripts/tests/fixtures/review/`; documented credential-free MCP templates and runtime setup. Use the confirmed current Codex runtime and GPT-6 Astra; qualify capabilities before implementation integration. Do not add a separate model API/SDK in this pilot. Keep review infrastructure outside game-core.

## Delivery order

1. Approve ADR/spec and infrastructure provenance convention. Record runtime, human approval and publication boundaries.
2. Define report/input schemas and deterministic fixtures before runtime integration.
3. Build immutable snapshot collection and policy loading, then independent worker adapters and bounded orchestration.
4. Add restricted source verification and explicit infrastructure applicability; use synthetic private-source fixtures in public tests.
5. Add aggregation, machine gates and public-safe publication candidate generation.
6. Validate GitHub adapter offline, then run an explicitly authorized sandbox pilot.
7. Have an administrator enable required checks only after advisory evidence and stale-result invalidation are demonstrated.

ADR/spec acceptance is recorded in provenance.json; implementation tasks may proceed within their dependencies and activation gates. OpenAI processing and runtime/model choices have been confirmed in chat. Runtime qualification, retention policy, App installation and repository settings remain activation gates.

## Trust boundaries

Coordinator uses trusted installed policy, never code from the reviewed checkout. Reader tools enforce allowlisted repository, SHA, paths and operations outside model prompts. Public test execution occurs in disposable environments without private files/credentials or access to the trusted runtime. Private reports remain in approved private storage; the publisher receives only validated public-safe fields. Public CI does not invoke model services or source-reader credentials.

## Verification

Use unit/contract fixtures for schema, capability, state machine and adapter behavior; integration fixtures for independent contexts, fail-closed aggregation, injection and disclosure. Use no private source snapshots or live secrets in tests. Run `pnpm run check` after implementation slices and meaningful relevant tests. Report hosted CI and live permissions separately from mocked evidence. Request independent six-axis review of implementation changes; human approval remains required.

## Pilot and rollback

Manual advisory mode first. Validate all six reports, resource limits, exact check names, expected GitHub App identity, stale/base-change handling, public output and human decision records on an authorized sandbox PR. Then seek administrator activation. On incident, stop coordinator/publication, revoke affected credentials and preserve only approved private evidence. Gate failure must remain visible; disabling required checks is a human administrator action, never an automatic recovery.

## Known issues and deferred choices

- `pnpm run spec:new -- --slug ...` currently passes an unsupported literal `--`; `pnpm run spec:new --slug ...` works. Fix/document this in the scaffold task, not this draft.
- The current generator requires private source paths. This draft was generated using the documented example path solely to initialize files, then replaced with explicit infrastructure-only metadata; it claims no relationship to that private document. Approve and test the generalized schema before automated consumption.
- The skill says affected-reviewer reruns while axes.md says full reruns. Proposed resolution: all six on changed review inputs. Align both only when this policy is accepted.
- Confirmed: current Codex / GPT-6 Astra, three concurrent reviewers, ten minutes per attempt, one technical retry, OpenAI processing consent and user-controlled solo-maintainer merge.
- Pending: runtime isolation/data-handling qualification, finite total/input/output budgets, private retention duration and GitHub App installation.
- Spec Kit/Beads, always-on hosting and webhook orchestration require separate proposals.
