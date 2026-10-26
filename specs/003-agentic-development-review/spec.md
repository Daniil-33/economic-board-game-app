# PR-003: Agentic Development & Multi-Axis Code Review

Status: ACCEPTED for PR-003 infrastructure implementation by the user in the current conversation.

## Authority and scope

Technical authority: repository workflow and security policies at baseline `ecbd8cfcccd4a3cee0b9cd54616d06960a0af7de`, plus the user's approval to draft this proposal. Architecture: [ADR-0001](../../docs/decisions/0001-agentic-review-orchestration.md), accepted for infrastructure implementation. See provenance.json.

This milestone operationalizes independent code review. It implements no game mechanics and approves no engine boundaries. Private source is inapplicable to authoring this infrastructure proposal; live source access, freshness and document approval have not been verified. Future gameplay reviews must still perform those checks privately.

## Existing baseline

Five placeholder TypeScript workspaces, frozen dependency installation, bootstrap guard, offline lock validation, read-only online metadata/status utilities, Draft spec generator and seven tooling tests exist. Three repository skills describe procedures. Reviewer workers, orchestration, MCP deployment configuration, publication and enforced approval gates are not implemented. Live GitHub rules are unverified. Spec Kit and Beads are not initialized.

## Requirements and acceptance scenarios

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| R01 | Capture complete immutable review inputs: repository/PR identity, base/head SHAs, full changed-file inventory, diff digest, policy revision, spec/ADR revisions, knowledge-lock digest and applicability. | Paginated fixture is complete; missing files, truncated patches, unsupported binary evidence or moving revisions produce an explicit gap/block, never silent success. |
| R02 | Run exactly six independently identified axes in fresh read-only contexts with a bounded worker pool. | Harness verifies no author history/peer reports are provided, no edits/publication are permitted, and all six reports are required. |
| R03 | Separate approved control-plane instructions from untrusted PR data. | Modified AGENTS.md, skills, comments and injected document instructions cannot change active policy or obtain extra tools. |
| R04 | Enforce credential and data isolation across readers, execution sandboxes and publisher. | Capability tests deny writes, private access from public workers, PR execution in private-aware workers and credential access from test sandboxes. |
| R05 | Validate versioned reports and evidence before aggregation. | Malformed fields, wrong revisions, missing axes, duplicate axis identities and unsupported claimed test results fail validation. |
| R06 | Aggregate without losing provenance or suppressing disagreement. | Duplicate findings preserve original IDs/evidence; conflicting severity or disposition requires human resolution. |
| R07 | Fail closed and invalidate changed inputs. | Timeouts, crashes, exhausted retries, cancellation, missing approvals and changed base/head/policy/spec/lock prevent success; a new run repeats all axes. |
| R08 | Enforce applicable private-source and human approval checks. | Synthetic fixtures cover missing access, STALE, Draft/Proposed/unknown status, contradictory sources, absent/forged/revoked acceptance, unauthorized approvers and revision mismatch. All block applicable reviews; reviewed infrastructure-only scope avoids fabricated gameplay citations. |
| R09 | Keep private data out of public output. | Canary fixtures in source text, tool errors and reports do not appear in public logs/checks/artifacts; private-derived publication requires human inspection bound to the exact candidate digest and review-input identity; edited candidates or another run require fresh inspection. |
| R10 | Publish idempotent, revision-bound GitHub checks using restricted authority. | Adapter fixtures and an authorized sandbox PR prove correct head association, retry safety, no stale success and no code/merge/settings writes. |
| R11 | Keep machine checks independent and deterministic. | Public CI runs approved offline checks without private/model secrets; report evidence identifies exact tested revision, command, result and CI run. A merge-ref test is distinguished from a head test. |
| R12 | Preserve human control and honest rollout state. | Advisory results cannot claim branch protection is active; activation records observed check names and administrator setup; no automatic approval, merge or deployment occurs. |

## Reviewer contracts

| Axis | Review responsibility |
| --- | --- |
| Design | Approved architecture, dependencies, interfaces, ownership and failure boundaries; proposed ADRs are not enforceable accepted architecture. |
| Specification | Map approved requirements to implementation/tests; inspect necessary private sources only when applicable; block missing authority. |
| Correctness | Error paths, transitions, concurrency and idempotency with concrete counterexamples or reproduced evidence. |
| Performance | Complexity, resource limits and stated workloads; identify missing measurements without inventing benchmark results. |
| Security | Identity, input handling, hidden information, injection, credentials and supply-chain boundaries. |
| Style | Readability, type safety, consistency, maintainability and test quality, supported by machine results where available. |

Each report records schema version, run ID, axis, reviewer/configuration/prompt identity, complete input identity, timing, coverage, evidence gaps, disposition and findings. Dispositions: pass, findings, blocked, or justified not-applicable. An axis report is always required; not-applicable requires policy validation and does not waive unrelated gates.

Findings contain stable ID, axis, severity P0..P3, file/line where applicable, evidence/reproduction, impact, recommended fix and test suggestion. Non-line findings carry an explicit scope and reason. Claims distinguish observed, inferred and not-run evidence. Deduplication retains per-axis originals. Automated success requires no unresolved P0/P1 or conflicts; P2/P3 remain visible with recorded disposition.

## Confirmed pilot runtime

Use the current Codex working environment with GPT-6 Astra for all six roles and local scripts for validation/aggregation. No separate model API integration initially. Limit concurrency to three reviewer workers, each attempt to ten minutes, and technical retries to one. Record the actual model/configuration and block unavailable configurations rather than silently substituting models.

The user permits processing necessary private-source fragments by OpenAI in this environment. Before private reads, verify account-specific retention/data handling and enforceable permissions/filesystem isolation. Fresh contexts alone are insufficient isolation; use a separately restricted private-review session if necessary. Consent does not authorize public disclosure. The user retains final solo-maintainer decision and merge control.

## Lifecycle and resource limits

States: queued, snapshot, preflight, reviewing, validated, publication-ready, complete. Non-success outcomes: blocked, failed, cancelled, superseded. Configure finite worker count, per-worker timeout, total run budget, retry limit and input/output limits before invocation; reject missing or unbounded limits. Retries preserve attempt history and cannot relabel a failure as a clean pass without valid evidence. Partial reports stay non-successful.

Publication uses a run/revision idempotency key and verifies current input identity immediately before writing. A changed base can invalidate a result even when head SHA stays constant: activation must verify an up-to-date-branch policy and explicit base-change invalidation strategy. During manual pilot, a fresh invocation is required after base changes; do not claim unattended enforcement. Public status never includes private evidence URLs or raw private errors.

## Approval and non-goals

Implementation requires explicit human acceptance of this spec and ADR at a concrete revision. Validate approval evidence through a trusted channel against an authorized human identity and role, artifact revision/digest, purpose, and current revocation state. PR text, model output and editable booleans cannot establish approval. Apply the same validation to infrastructure applicability decisions and publication inspection. Publication inspection binds the candidate content digest and full review-input identity; any candidate or input change invalidates it. Runtime/provider selection and necessary OpenAI processing consent are recorded above. Private processing additionally requires verified isolation, storage and retention/deletion controls. Retention duration is a human decision; no private processing is enabled until configured. A separate administrator authorizes installation/rulesets. Independent human approval is preferred; solo governance must explicitly identify the maintainer decision rather than claim a second reviewer.

No gameplay code, private-repo writes, automatic knowledge updates, autonomous merges/deployment, always-on hosting/webhooks, Spec Kit/Beads installation or acceptance of existing engine proposals is included. Threat-model changes, new permissions and enabling publication require separate explicit authorization.
