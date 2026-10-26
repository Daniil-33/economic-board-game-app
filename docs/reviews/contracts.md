# Review contracts v1

First implementation slice of PR-003, task T03 (R01/R05): [approved design PR](https://github.com/Daniil-33/economic-board-game-app/pull/3), design commit `df7106d07c188f274c323e00e7d123852205ac9f`. The user authorized infrastructure implementation in the working conversation. No gameplay source is applicable.

`scripts/review/contracts.mjs` validates exact-field JSON objects, immutable input identity, per-axis reports and complete six-axis report sets. `scripts/tests/review-contracts.test.mjs` contains synthetic examples and negative cases; no private documents are used.

Input identity includes repository, PR, base/head SHAs, diff/knowledge-lock SHA-256 digests, policy/spec/ADR commit revisions and infrastructure/gameplay applicability. Reports also bind a run ID, axis, distinct reviewer execution ID, model/configuration/prompt identity, canonical UTC timestamps, coverage, gaps, disposition, reason, evidence and findings. Finding locations are either repository-relative file/positive line or explicit non-line scope. All validators throw generic field errors without echoing supplied values and return their original input on success. They do not execute references or publish content.

A structurally valid report is not a trusted report. Evidence strings, model identity, applicability and approval claims require external verification. Observed/inferred/not-run tags classify assertions; they do not prove a test ran. Caller-supplied expected identity must originate from a trusted collector. Distinct execution IDs cannot prove context or permission isolation. Not-applicable dispositions require subsequent policy approval. Blocked reports can be structurally valid and must remain blocking downstream.

No aggregator, source reader, snapshot collector, authenticated approval check, model runner, publisher or merge gate is delivered here. Validation does not sanitize private text for publication. Later consumers must enforce input byte limits before parsing, finite runtime budgets, authentic evidence and all approval/confidentiality gates. Arrays and text are bounded here for individual contract fields. Public CI remains offline.

Run `pnpm run check` to exercise contract tests with the existing suite.
