# Bounded review orchestration

This slice implements the lifecycle and scheduling boundary for PR-003. `runReviewOrchestration` accepts a trusted review input and six injected worker functions, allows at most three concurrent workers, applies the approved ten-minute-style finite timeout contract (the test API uses milliseconds), retries one technical failure, validates each report, and returns `complete`, `blocked`, or `superseded`.

Workers receive only a frozen run ID, axis and cloned review input. They do not receive peer reports, author conversation, GitHub clients or private-source tools through this module. Worker errors are summarized by axis without echoing error text. A malformed report, timeout or exhausted retry blocks the run. A current-input callback is checked before and after execution; it must be backed by a trusted collector in a later integration.

This is not a model runner, authentication boundary, private-source reader, aggregator, publisher or merge gate. The injected workers remain untrusted until a later capability layer establishes their identity and permissions. Reports are validated structurally; `complete` means six valid reports were collected, not that the PR passed review.
