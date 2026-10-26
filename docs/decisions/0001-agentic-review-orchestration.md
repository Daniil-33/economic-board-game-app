# ADR-0001: Independent agent review orchestration

Status: ACCEPTED for PR-003 infrastructure implementation by the user in the current conversation.
Date: 2026-10-26
Scope: PR-003 development infrastructure only.

## Context

PR-001/002 provide workspace checks, private-source metadata utilities and procedural skills. No automated independent review gate exists. This public repository must not expose private product documents or execute PR code with privileged credentials. Engine-boundary proposals remain unapproved and are outside this decision.

The user approved the proposed direction as the basis for Draft documents, not implementation. Normative inputs are AGENTS.md, docs/workflow.md, docs/knowledge-integration.md, docs/reviews/axes.md and docs/infrastructure/mcp.md. No private gameplay requirements are introduced or verified here.

## Decision

1. Start with a manually invoked coordinator in a trusted private runtime. Public PR CI remains deterministic and has no private-source or model credentials. Continuous hosting and webhook automation are deferred.
2. Run six independent read-only workers: design, specification compliance, correctness, performance, security, and style/maintainability. Each gets the same immutable public review package, fresh context and no author conversation or peer reports. Only the specification worker receives necessary private evidence. Worker concurrency is bounded; six roles need not run simultaneously.
3. Load coordinator code, tools and review instructions from an approved policy revision. Treat PR files, changed skills, comments, model output and retrieved documents as data. A PR cannot activate its own proposed policy changes.
4. Separate public test sandboxes, private-source access, and GitHub publication. Private-aware workers cannot execute PR code. Execution sandboxes have neither credentials nor private documents. Review workers cannot edit code or publish results.
5. Use distinct restricted capabilities: implementation author, public repository reader, private knowledge reader, and public Checks publisher. The publisher has no Contents-write or private-source access. Optional PR comments require a separately authorized permission. Token scopes and server configuration must be verified, not inferred from tool availability.
6. Bind reports to repository, PR, base/head SHAs, diff digest, policy revision, spec/ADR revisions and knowledge-lock digest. Any change to these inputs supersedes the result and requires all six reviews again. Final publication rechecks inputs; superseded runs cannot publish success.
7. Block on failed required machine checks, missing/invalid/stale reports, unresolved P0/P1, unresolved review conflicts, unapproved applicable requirements, and unavailable/conflicting/stale required private sources. P2/P3 remain visible and require recorded disposition. A reviewer failure is never a pass.
8. Publish six axis checks and an aggregate check through a restricted GitHub App/API adapter. Begin in advisory mode; an administrator later enables exact observed contexts and expected publisher identity as required checks. AI checks never substitute for human approval or authorize a merge.
9. Require human inspection before publishing any private-derived report. Raw documents, private reports and credentials never enter public diffs, comments, logs or artifacts. Source-reader output must use a restricted private channel; public-safe fields are explicitly selected, not merely redacted by an LLM.
10. Allow explicitly reviewed infrastructure-only provenance with no gameplay source paths. This does not waive private-source gates for gameplay changes or approve the pinned product documents. Spec Kit and Beads installation is deferred to a separate compatibility decision.

## Runtime decisions confirmed in chat

The user confirmed the architecture direction and the following pilot choices. The subsequent user instruction to create the PR and start coding authorizes infrastructure implementation. Operational activation gates remain separate.

- Runtime: current Codex working environment, invoked manually; local project scripts validate schemas and aggregate results. No separate model API integration or hosted service initially.
- Model: GPT-6 Astra for all six reviewer roles, using fresh independent contexts. Record actual model/configuration identity; do not silently substitute an unavailable model.
- Limits: at most three concurrent reviewers, ten minutes per reviewer attempt, and one retry for a technical failure. Exhausted attempts remain non-successful. Total run and input/output budgets must also be finite and validated before activation.
- Data processing: user permits necessary private gameplay document fragments to be processed by OpenAI in this selected environment. This does not authorize publication, other providers or unrestricted document ingestion.
- Runtime qualification: verify account-specific data handling/retention and effective tool/filesystem isolation before private-source access. Local coordination does not imply local inference; separate contexts do not prove security isolation. Use a separately restricted session for the private reviewer if needed; block private processing if controls cannot be established.
- Human governance: the user is the final maintainer decision-maker and controls merge; do not claim an independent second human reviewer. Private-derived publication still requires inspection of the exact outgoing content.

## Alternatives and consequences

A single reviewer is simpler but does not satisfy independent axes. A privileged public workflow combines untrusted execution and private access and is rejected. An always-on service adds hosting, authentication and operational cost before the protocol is validated; defer it.

The chosen separation increases orchestration and identity-management work. Full reruns cost more but avoid ambiguous reuse. Fresh contexts reduce information sharing, not correlated model mistakes; independent machine checks and human decisions remain necessary. Human publication inspection limits initial throughput.

## Approval and activation

- [x] User accepts the discussed architecture/specification and instructs creation of the PR and commencement of code.
- [x] User selects current Codex / GPT-6 Astra and consents to necessary private-data processing by OpenAI.
- [x] User selects explicit solo-maintainer decision and merge control.
- [ ] Qualify runtime isolation and account-specific storage/retention controls before private processing; confirm remaining retention policy.
- [ ] Administrator approves App installation, credentials and later ruleset changes separately.

Drafting consent alone is not implementation approval. The subsequent chat decisions above record runtime and governance consent, without claiming technical qualification or final document acceptance. Accepted policy must be recorded against a concrete document revision by an authorized human through a trusted channel; validate identity, role, purpose, revision and revocation state. An editable approval boolean alone is insufficient. The same rules apply to infrastructure applicability and publication inspection. Inspection binds the exact outgoing candidate digest and review-input identity; edits invalidate it.

See [specification](../../specs/003-agentic-development-review/spec.md), [plan](../../specs/003-agentic-development-review/plan.md) and [tasks](../../specs/003-agentic-development-review/tasks.md).
