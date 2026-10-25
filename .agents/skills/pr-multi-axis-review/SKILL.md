---
name: pr-multi-axis-review
description: Independently assess a pull request across architecture, gameplay spec conformance, correctness, performance, security and maintainability.
---

# Multi-axis PR review (manual orchestration until PR-003)

1. Pin `baseSHA`, `headSHA`, diff, approved spec/ADR and accessible source-of-truth references. Reject unapproved gameplay behavior.
2. Conduct six **separate** reviews using [review axes](../../../docs/reviews/axes.md), with independent contexts when agent subworkers are available. Reviewers are read-only and must not share prior reviewer summaries before writing their own reports.
3. Findings have severity P0..P3, file and line, specific evidence/reproduction, impact and remediation. Mark evidence gaps instead of inventing runtime results.
4. Synthesize duplicate findings, preserve per-axis provenance and ask a human for decisions on conflicts; do not silently upgrade a Draft product rule.
5. Route P0/P1 to the author for fixes, then re-run machine checks and all affected independent reviewers on the **new headSHA**. AI reviews alone do not grant GitHub human approval or auto-merge rights.
6. This skill is a procedure, **not** an installed autonomous GitHub Actions review bot. Implement and validate its automation in a later PR.
