# Agentic engineering workflow (proposed)

## Separate concerns
**Knowledge repository:** product/game mechanics, accepted/proposed/rejected decisions and approvals. **Implementation repository:** technical specifications, code, infrastructure, agent skills and review reports. Do not overwrite normative rules in this repository. Link using exact source ref/SHA; stop on unresolved upstream conflicts.

## Request to delivery
1. **Intake:** read pinned source and approval status, identify scope, add a small issue.
2. **Specify:** build a Draft spec with linked upstream references, deterministic acceptance scenarios and non-goals.
3. **Architect:** write a Plan and proposed ADRs for boundaries/interfaces; human reviews and approves.
4. **Task:** split into small commits/PRs and measurable tasks; dependencies explicit.
5. **Implement:** agent works from current main in `feature/*` branch; add tests for expected/invalid behavior, preserve authority and hidden-information boundaries.
6. **Check:** automated lint/type/unit/integration/architecture checks plus independent multi-axis reviewers for architecture, source conformance, correctness, performance and security. Classify findings P0..P3, attach file/line and reproduction evidence; do not merely rubber-stamp.
7. **Remediate:** agent fixes findings in the PR branch, reruns checks and review. Human decides merge.
8. **Reconcile:** record upstream rule-impact questions back in knowledge repository as proposals, not unilateral amendments.

## Pull request governance
- `main` only through PR; squash merge preferred; delete merged branches.
- Human gate for architecture acceptance, new game mechanics, security boundary changes, financial transitions, infrastructure deployments and merges.
- Each PR references upstream SHA, specification, ADR (if any), test evidence and reviewers; attach any uncovered drift.
- PR author and AI reviewers must not be treated as independent human approvers. Required GitHub protections must be configured separately (see infra settings).

## Review gate rollout
PR-001 introduces docs, stub packages and bootstrap CI. It **does not** claim that AI reviewers run automatically or that branch protection is already enabled. PR-002 adds authenticated read-only knowledge sync and drift checks. PR-003 adds actual review-agent orchestration, Spec Kit/Beads setup, permissions and branch policy validation; test this on a small practice PR before implementing game rules.
