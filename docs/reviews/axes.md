# Independent PR review axes — contract (not yet automated)

Every reviewer receives the **same immutable PR head SHA and diff**, the approved implementation spec, relevant ADRs and permitted citations to the upstream product rules. Reviewers must operate independently of the author/each other and not edit implementation files.

| Axis | Evidence sought | Example failures |
| --- | --- | --- |
| Architecture / design | Allowed module dependencies, boundaries, invariant ownership | `game-core` imports transport or persistence |
| Specification / gameplay | Source-of-truth SHA, approved acceptance criteria | Bonus turn treated as re-roll, IPO changes share count |
| Correctness / concurrency | Transaction boundaries, error paths, replays, deterministic tests | Duplicate payment, revision race, lost update |
| Performance | Complexity and measured benchmarks at stated loads | Exhaustive economic search without timeout |
| Security | Identity, input validation, secrecy, permissions, supply chain | Leaks hidden bids, unauthenticated command |
| Code style / maintainability | Typecheck, formatter, lint, test quality | `any` masking critical state transitions |

Each finding should have `axis`, `severity` (P0 critical, P1 blocker, P2 major, P3 minor), `file`, `line`, `evidence`, `risk`, `recommendedFix`, `testSuggestion`. Prefer concrete defects over speculation. Run machine-checked static analysis separately; absence of LLM concerns is not evidence tests ran.

Blocking merge on P0/P1, unresolved source-of-truth drift or failing required machine gates is recommended. Review orchestrator deduplicates overlapping findings without dropping underlying evidence. Changes to PR head require full rerun. Initial bootstrap only documents the contract; orchestration follows in PR-003.
