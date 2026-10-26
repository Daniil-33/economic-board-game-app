# PR-003 candidate implementation tasks

Status: APPROVED candidate task sequence for PR-003 infrastructure. ADR/spec acceptance is recorded in provenance.json. Operational activation gates still apply.

| ID | Task / deliverable | Depends on | Independently verifiable completion |
| --- | --- | --- | --- |
| T01 | Record accepted ADR/spec, infrastructure applicability and human approval policy. | Human review | Acceptance tied to concrete revisions; unresolved operational approvals listed explicitly. |
| T02 | Extend scaffold/provenance contract for infrastructure-only specs; correct CLI invocation documentation. | T01 | Existing gameplay scaffolds remain Draft/unverified; infrastructure fixtures contain no invented source paths; documented command succeeds. |
| T03 | Define input/report schemas and severity/disposition rules (R01, R05). | T01 | Valid fixtures pass; missing axes/identity/evidence and invalid severities fail. |
| T04 | Add credential-free MCP templates and capability tests (R03, R04). | T01 | Read scope works; forbidden operations denied by tools/server, not just prompts; secrets absent from tracked config. |
| T05 | Build complete immutable snapshot collector (R01). | T03 | Pagination, truncated diff, moving SHA and unsupported evidence fixtures behave explicitly and fail closed. |
| T06 | Define six isolated reviewer roles and runtime adapter (R02–R04). | T03, T04, T05; qualify selected runtime | Six fresh contexts receive identical public identity; no peer reports, writes or publisher tools. |
| T07 | Implement bounded lifecycle and supersession (R07). | T06 | Crash, timeout, retry exhaustion, cancellation and changed inputs cannot produce aggregate success. |
| T08 | Add private provenance/applicability gate (R08, R09). | T02, T04; isolation/retention qualification for consented live use | Synthetic missing-token, stale, Draft, conflict, forged/revoked approval, unauthorized approver and revision-mismatch cases block; infrastructure classification is explicit and reviewed. |
| T09 | Aggregate findings and human resolutions (R05, R06). | T03, T07 | Deduplication preserves originals; severity disputes and absent reports block. |
| T10 | Add approved lint/format/workflow and approval-policy checks (R11). | T01, T03 | Seeded defects fail offline; current baseline passes; no private or model secrets in public jobs. |
| T11 | Generate publication candidates with confidentiality gate (R09). | T08, T09 | Canary text/errors never reach public output; private-derived output awaits authenticated human inspection of the exact candidate digest/run; changed candidates invalidate inspection. |
| T12 | Implement revision-bound idempotent Checks adapter (R10). | T07, T11 | Mock retries, stale SHA/base and duplicate requests cannot publish misleading success; no merge/settings/write-content capability. |
| T13 | Run adversarial end-to-end fixtures (R01–R12). | T08–T12 | Injection, partial evidence, reviewer outage and stale reports fail safely; six valid reports plus gates succeed. |
| T14 | Run advisory sandbox pilot and independent implementation reviews. | T13; explicit publication/App authorization | Real check links and permission evidence recorded safely; all P0/P1 fixed, six reviews rerun and `pnpm run check` passes. |
| T15 | Activate administrator-owned rules and document operation. | T14; administrator approval | Exact contexts/publisher and human gate verified; base-change invalidation demonstrated; no claim of unattended protection without proof. |

Spec Kit/Beads evaluation is a separate follow-up, not a dependency of PR-003. Live access failures remain blockers for the relevant task; fixture success cannot stand in for live capability verification.
