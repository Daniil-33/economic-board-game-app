# Immutable PR snapshot

This is the next PR-003 slice after the report contracts. `scripts/review/snapshot.mjs` collects pull-request metadata and changed-file pages through an injected read-only adapter, normalizes and sorts files, computes a SHA-256 diff digest, rechecks the PR identity, and creates the review input consumed by `contracts.mjs`.

The adapter must explicitly return `nextPage: null` to end pagination. The collector rejects duplicate or unsafe paths, malformed counters, oversized patches, excessive files, closed PRs, movement of base/head while collecting, and digest tampering. Errors contain field labels only. No network client, credentials, private-source reader, model runner, GitHub publisher or merge decision is included. Public tests use synthetic adapter fixtures.

The collector's limits are intentionally finite but conservative. An upstream adapter must enforce its own response byte limits and report truncation as an error before handing data to this module. The resulting snapshot is immutable by convention: downstream code must retain the returned object and bind any report to its `input` identity. Snapshot collection does not prove reviewer identity, source approval, evidence authenticity or branch freshness after collection.
